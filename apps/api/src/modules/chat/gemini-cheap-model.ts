import { GoogleGenAI } from "@google/genai";
import { env } from "../../env.js";
import { extractResponseUsage, type TokenUsage } from "./gemini-utils.js";

const DEFAULT_CHEAP_MODEL = "gemini-2.5-flash-lite";
const DATA_THRESHOLD = 2000; // chars — below this, skip cheap model

let cheapClient: GoogleGenAI | null = null;

function getClient(): GoogleGenAI {
  if (!cheapClient) {
    if (!env.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is not configured");
    cheapClient = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
  }
  return cheapClient;
}

export interface SkillResult {
  text: string;
  usage: TokenUsage | null;
}

/** Per-skill LLM config overrides */
export interface SkillModelConfig {
  modelName?: string;
  temperature?: number;
}

/** Check if raw data exceeds threshold and should be processed by cheap model */
export function needsProcessing(rawData: string): boolean {
  return rawData.length > DATA_THRESHOLD;
}

/**
 * Process raw data through model using skill instructions.
 * Accepts optional per-skill model config (name, temperature).
 * Falls back to default cheap model on error.
 */
export async function processWithSkill(
  skillInstruction: string,
  userQuestion: string,
  rawData: string,
  modelConfig?: SkillModelConfig,
): Promise<SkillResult> {
  try {
    const client = getClient();
    const prompt = `## CÂU HỎI NGƯỜI DÙNG\n${userQuestion}\n\n## DỮ LIỆU\n${rawData}`;

    const model = modelConfig?.modelName || DEFAULT_CHEAP_MODEL;
    const config: Record<string, unknown> = { systemInstruction: skillInstruction };
    if (modelConfig?.temperature !== undefined) {
      config.temperature = modelConfig.temperature;
    }

    const response = await client.models.generateContent({
      model,
      contents: prompt,
      config,
    });

    const usage = extractResponseUsage(response);
    return { text: response.text ?? rawData, usage };
  } catch (err) {
    console.warn("[CheapModel] Processing failed, using raw data:", (err as Error).message);
    return { text: rawData, usage: null };
  }
}
