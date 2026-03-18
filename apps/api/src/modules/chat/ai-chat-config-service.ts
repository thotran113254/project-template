import { eq, sql } from "drizzle-orm";
import { db } from "../../db/connection.js";
import { aiChatConfigs, aiDataSettings } from "../../db/schema/index.js";

// ─── In-memory cache (invalidated on update) ────────────────────────────────

let configCache: Map<string, string> | null = null;
let configCachedAt = 0;
const CONFIG_CACHE_TTL = 60_000; // 1 min

async function loadConfigs(): Promise<Map<string, string>> {
  if (configCache && Date.now() - configCachedAt < CONFIG_CACHE_TTL) {
    return configCache;
  }
  const rows = await db.select().from(aiChatConfigs);
  configCache = new Map(rows.map((r) => [r.configKey, r.configValue]));
  configCachedAt = Date.now();
  return configCache;
}

export function invalidateConfigCache(): void {
  configCache = null;
  configCachedAt = 0;
}

// ─── Typed getters ──────────────────────────────────────────────────────────

async function getString(key: string, fallback: string): Promise<string> {
  const configs = await loadConfigs();
  return configs.get(key) ?? fallback;
}

async function getNumber(key: string, fallback: number): Promise<number> {
  const configs = await loadConfigs();
  const val = configs.get(key);
  if (!val) return fallback;
  const num = parseFloat(val);
  return isNaN(num) ? fallback : num;
}

// ─── Public API: Model config ───────────────────────────────────────────────

export async function getModelConfig() {
  return {
    modelName: await getString("model_name", "gemini-3-flash-preview"),
    temperature: await getNumber("temperature", 0),
    thinkingLevel: await getString("thinking_level", "LOW"),
    maxToolRounds: await getNumber("max_tool_rounds", 5),
    cheapModelName: await getString("cheap_model_name", "gemini-2.5-flash-lite"),
    cheapModelThreshold: await getNumber("cheap_model_threshold", 2000),
    cacheTtlMinutes: await getNumber("cache_ttl_minutes", 5),
    maxHistoryMessages: await getNumber("max_history_messages", 30),
  };
}

// ─── Public API: Prompt sections ────────────────────────────────────────────

const PROMPT_DEFAULTS: Record<string, string> = {
  prompt_role: `Bạn là AI trợ lý nội bộ cho nhân viên sale du lịch. Nhiệm vụ: giúp sale tra cứu nhanh và tư vấn khách hàng chính xác.`,
  prompt_response_format: `- Giá: format VND có dấu chấm (vd: 2.800.000₫)
- Bảng giá: dùng markdown table khi có nhiều mức giá
- Gợi ý upsell: nếu khách hỏi phòng rẻ → gợi ý thêm phòng tốt hơn chênh ít
- Cuối câu trả lời: gợi ý sale hỏi thêm gì hoặc chốt deal`,
};

export async function getPromptSection(key: string): Promise<string> {
  return getString(key, PROMPT_DEFAULTS[key] ?? "");
}

/** Get all prompt_ configs as key-value map */
export async function getAllPromptSections(): Promise<Map<string, string>> {
  const configs = await loadConfigs();
  const prompts = new Map<string, string>();
  for (const [k, v] of configs) {
    if (k.startsWith("prompt_")) prompts.set(k, v);
  }
  // Fill defaults for missing keys
  for (const [k, v] of Object.entries(PROMPT_DEFAULTS)) {
    if (!prompts.has(k)) prompts.set(k, v);
  }
  return prompts;
}

// ─── Public API: Creativity levels per data category ────────────────────────

export type CreativityLevel = "strict" | "enhanced" | "creative";

export async function getCreativityLevels(): Promise<Record<string, CreativityLevel>> {
  const rows = await db.select({
    category: aiDataSettings.dataCategory,
    level: aiDataSettings.creativityLevel,
  }).from(aiDataSettings);

  return Object.fromEntries(
    rows.map((r) => [r.category, r.level as CreativityLevel]),
  );
}

/** Build creativity instructions for system prompt based on per-category settings */
export async function buildCreativityInstructions(): Promise<string> {
  const levels = await getCreativityLevels();
  const strict: string[] = [];
  const enhanced: string[] = [];
  const creative: string[] = [];

  const categoryLabels: Record<string, string> = {
    property: "cơ sở lưu trú",
    pricing: "bảng giá",
    attraction: "điểm tham quan",
    dining: "ẩm thực",
    transportation: "phương tiện di chuyển",
    itinerary: "lịch trình",
    competitor: "đối thủ cạnh tranh",
    target_customer: "khách hàng mục tiêu",
    journey: "hành trình khách hàng",
    inventory_strategy: "chiến lược ôm phòng",
    market: "thông tin thị trường",
    knowledge_base: "knowledge base",
  };

  for (const [cat, level] of Object.entries(levels)) {
    const label = categoryLabels[cat] ?? cat;
    if (level === "strict") strict.push(label);
    else if (level === "enhanced") enhanced.push(label);
    else if (level === "creative") creative.push(label);
  }

  let text = "\n## MỨC ĐỘ SÁNG TẠO THEO DANH MỤC\n";

  if (strict.length > 0) {
    text += `**Chỉ dùng dữ liệu hệ thống (KHÔNG bịa):** ${strict.join(", ")}\n`;
    text += `→ Các mục này CHỈ trả lời dựa trên kết quả tool. Nếu không có dữ liệu → nói rõ "chưa có trong hệ thống".\n\n`;
  }

  if (enhanced.length > 0) {
    text += `**Kết hợp dữ liệu hệ thống + kiến thức model:** ${enhanced.join(", ")}\n`;
    text += `→ Ưu tiên dữ liệu hệ thống, nhưng được BỔ SUNG thêm gợi ý từ kiến thức chung. Ghi rõ "[Gợi ý thêm]" khi dùng kiến thức ngoài.\n\n`;
  }

  if (creative.length > 0) {
    text += `**Tự do sáng tạo:** ${creative.join(", ")}\n`;
    text += `→ Được phép gợi ý sáng tạo, tư vấn linh hoạt dựa trên kiến thức du lịch.\n`;
  }

  return text;
}

// ─── CRUD for admin ─────────────────────────────────────────────────────────

export async function listAllConfigs() {
  return db.select().from(aiChatConfigs).orderBy(aiChatConfigs.category, aiChatConfigs.sortOrder);
}

export async function updateConfig(configKey: string, configValue: string) {
  const [updated] = await db.update(aiChatConfigs)
    .set({ configValue, updatedAt: sql`now()` })
    .where(eq(aiChatConfigs.configKey, configKey))
    .returning();
  if (!updated) throw new Error(`Config "${configKey}" not found`);
  invalidateConfigCache();
  return updated;
}

export async function updateCreativityLevel(
  dataCategory: string,
  creativityLevel: CreativityLevel,
) {
  const [updated] = await db.update(aiDataSettings)
    .set({ creativityLevel, updatedAt: sql`now()` })
    .where(eq(aiDataSettings.dataCategory, dataCategory))
    .returning();
  return updated;
}

/** Reset a config to its seed default value */
export async function resetConfigToDefault(configKey: string) {
  const { aiChatConfigsData } = await import("../../db/seed/data/ai-chat-configs-seed-data.js");
  const defaultEntry = aiChatConfigsData.find((c) => c.configKey === configKey);
  if (!defaultEntry) throw new Error(`No default found for "${configKey}"`);

  const [updated] = await db.update(aiChatConfigs)
    .set({ configValue: defaultEntry.configValue, updatedAt: sql`now()` })
    .where(eq(aiChatConfigs.configKey, configKey))
    .returning();
  if (!updated) throw new Error(`Config "${configKey}" not found`);
  invalidateConfigCache();
  return updated;
}
