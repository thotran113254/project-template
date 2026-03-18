import { PRICING_SEARCH_SKILL } from "./pricing-search-skill.js";
import { OVERVIEW_SEARCH_SKILL } from "./overview-search-skill.js";
import { ATTRACTIONS_SEARCH_SKILL } from "./attractions-search-skill.js";
import { ITINERARY_SEARCH_SKILL } from "./itinerary-search-skill.js";
import { BUSINESS_DATA_SEARCH_SKILL } from "./business-data-search-skill.js";
import { KB_SEARCH_SKILL } from "./kb-search-skill.js";
import { COMPARISON_FORMAT_SKILL } from "./comparison-format-skill.js";
import type { SkillModelConfig } from "../gemini-cheap-model.js";

/** Hardcoded defaults — used as fallback when DB has no custom value */
const HARDCODED_SKILLS: Record<string, string> = {
  skill_overview: OVERVIEW_SEARCH_SKILL,
  skill_pricing: PRICING_SEARCH_SKILL,
  skill_comparison: COMPARISON_FORMAT_SKILL,
  skill_attractions: ATTRACTIONS_SEARCH_SKILL,
  skill_itinerary: ITINERARY_SEARCH_SKILL,
  skill_business: BUSINESS_DATA_SEARCH_SKILL,
  skill_kb: KB_SEARCH_SKILL,
};

/** Map tool name → skill config key in ai_chat_configs */
const TOOL_TO_SKILL_KEY: Record<string, string> = {
  getMarketOverview: "skill_overview",
  getPropertyDetails: "skill_overview",
  getPropertyPricing: "skill_pricing",
  compareProperties: "skill_comparison",
  searchProperties: "skill_overview",
  getMarketAttractions: "skill_attractions",
  getItineraryTemplates: "skill_itinerary",
  getMarketBusinessData: "skill_business",
  searchKnowledgeBase: "skill_kb",
};

/** Resolved skill: prompt + optional model overrides */
export interface ResolvedSkill {
  prompt: string;
  modelConfig?: SkillModelConfig;
}

// ─── DB-backed skill cache ──────────────────────────────────────────────────

let skillCache: Map<string, string> | null = null;
let skillCachedAt = 0;
const SKILL_CACHE_TTL = 60_000;

async function loadSkillsFromDb(): Promise<Map<string, string>> {
  if (skillCache && Date.now() - skillCachedAt < SKILL_CACHE_TTL) {
    return skillCache;
  }
  try {
    const { db } = await import("../../../db/connection.js");
    const { aiChatConfigs } = await import("../../../db/schema/index.js");
    const { eq } = await import("drizzle-orm");
    const rows = await db.select().from(aiChatConfigs).where(eq(aiChatConfigs.category, "skill"));
    skillCache = new Map(rows.map((r) => [r.configKey, r.configValue]));
  } catch {
    skillCache = new Map();
  }
  skillCachedAt = Date.now();
  return skillCache;
}

/** Get skill prompt + model config for a tool. Reads from DB, falls back to hardcoded. */
export async function getSkillForToolAsync(toolName: string): Promise<ResolvedSkill | null> {
  const skillKey = TOOL_TO_SKILL_KEY[toolName];
  if (!skillKey) return null;

  const dbSkills = await loadSkillsFromDb();

  // Prompt: DB value if non-empty, else hardcoded
  const dbPrompt = dbSkills.get(skillKey);
  const prompt = (dbPrompt && dbPrompt.trim().length > 0) ? dbPrompt : HARDCODED_SKILLS[skillKey];
  if (!prompt) return null;

  // Model overrides: read companion keys (e.g., skill_pricing_model, skill_pricing_temp)
  const modelName = dbSkills.get(`${skillKey}_model`) || undefined;
  const tempStr = dbSkills.get(`${skillKey}_temp`);
  const temperature = tempStr ? parseFloat(tempStr) : undefined;

  const modelConfig: SkillModelConfig = {};
  if (modelName && modelName.trim()) modelConfig.modelName = modelName;
  if (temperature !== undefined && !isNaN(temperature)) modelConfig.temperature = temperature;

  return {
    prompt,
    modelConfig: Object.keys(modelConfig).length > 0 ? modelConfig : undefined,
  };
}

/** Sync version — uses hardcoded only (for backward compat) */
export function getSkillForTool(toolName: string): string | null {
  const skillKey = TOOL_TO_SKILL_KEY[toolName];
  if (!skillKey) return null;
  return HARDCODED_SKILLS[skillKey] ?? null;
}

export function invalidateSkillCache(): void {
  skillCache = null;
  skillCachedAt = 0;
}
