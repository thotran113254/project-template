import { eq, sql } from "drizzle-orm";
import { db } from "../../db/connection.js";
import { knowledgeBase } from "../../db/schema/index.js";

/** Admin user ID used as created_by for synced articles */
const SYSTEM_USER_QUERY = db
  .select({ id: knowledgeBase.createdBy })
  .from(knowledgeBase)
  .limit(1);

interface SheetConfig {
  url: string;
  category: string;
  sourceType: string;
  title: string;
}

const SHEETS: SheetConfig[] = [
  {
    url: "https://docs.google.com/spreadsheets/d/1wFtb7piltyNRg0tvu_44QloQhsTDII5S42_jT8uaGtY/export?format=csv",
    category: "pricing",
    sourceType: "pricing",
    title: "Pricing Rules & Transport",
  },
  {
    url: "https://docs.google.com/spreadsheets/d/1tY-8wvKx_ctw6QavNAxXJDWVWg8kHuM7Y8KcAgXVH-Q/export?format=csv&gid=1270346177",
    category: "competitors",
    sourceType: "competitor",
    title: "Competitor Analysis",
  },
  {
    url: "https://docs.google.com/spreadsheets/d/1oH8qn4_Sc4V12glQ0xasa_USsJqBYxo3k7SKBJ1Lq2g/export?format=csv&gid=28729887",
    category: "itineraries",
    sourceType: "itinerary",
    title: "Itinerary Templates",
  },
  {
    url: "https://docs.google.com/spreadsheets/d/10FAEfMc2wBBp5Ak5zUcdwWffLEvVnXFrTxnMgvJexQo/export?format=csv&gid=1867897935",
    category: "customer-journey",
    sourceType: "customer-journey",
    title: "Customer Journey Stages",
  },
  {
    url: "https://docs.google.com/spreadsheets/d/1YZHYpGwzxQ35kKBAwin46P2ehkixaLpKUpuqE39Ncmo/export?format=csv&gid=943483078",
    category: "hotel-evaluation",
    sourceType: "hotel-evaluation",
    title: "Hotel Evaluation Criteria",
  },
  {
    url: "https://docs.google.com/spreadsheets/d/1aTT0SOCm0KRdecPlpvjeKTpBOjCInLJav4ToER8VIOs/export?format=csv&gid=1328187184",
    category: "general",
    sourceType: "general",
    title: "General Reference Data",
  },
];

/** Fetch CSV text from a Google Sheets export URL (follows redirects) */
async function fetchCsv(url: string): Promise<string> {
  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  return res.text();
}

/** Parse CSV text into rows (handles quoted fields with commas) */
function parseCsv(csv: string): string[][] {
  const rows: string[][] = [];
  for (const line of csv.split(/\r?\n/)) {
    if (!line.trim()) continue;
    const cells: string[] = [];
    let inQuotes = false;
    let cell = "";
    for (let i = 0; i < line.length; i++) {
      const ch = line[i]!;
      if (ch === '"') {
        inQuotes = !inQuotes;
      } else if (ch === "," && !inQuotes) {
        cells.push(cell.trim());
        cell = "";
      } else {
        cell += ch;
      }
    }
    cells.push(cell.trim());
    rows.push(cells);
  }
  return rows;
}

/** Convert CSV rows to readable Markdown-table content */
function csvToMarkdown(rows: string[][]): string {
  if (rows.length === 0) return "";
  const [header, ...dataRows] = rows;
  if (!header || header.every((h) => !h)) return "";

  const lines: string[] = [];
  lines.push("| " + header.join(" | ") + " |");
  lines.push("| " + header.map(() => "---").join(" | ") + " |");
  for (const row of dataRows) {
    // Pad row to header length
    const padded = header.map((_, i) => row[i] ?? "");
    lines.push("| " + padded.join(" | ") + " |");
  }
  return lines.join("\n");
}

/** Resolve the admin user ID to use as created_by */
async function resolveAdminUserId(): Promise<string> {
  const { users } = await import("../../db/schema/index.js");
  const { eq: eqOp } = await import("drizzle-orm");
  const [admin] = await db
    .select({ id: users.id })
    .from(users)
    .where(eqOp(users.role, "admin"))
    .limit(1);
  if (!admin) throw new Error("No admin user found. Run db:seed first.");
  return admin.id;
}

export interface SyncResult {
  created: number;
  updated: number;
}

/** Upsert a single KB article for a sheet (by sourceUrl) */
async function upsertArticle(
  sheet: SheetConfig,
  content: string,
  adminId: string,
): Promise<"created" | "updated"> {
  const [existing] = await db
    .select({ id: knowledgeBase.id })
    .from(knowledgeBase)
    .where(eq(knowledgeBase.sourceUrl, sheet.url))
    .limit(1);

  if (existing) {
    await db
      .update(knowledgeBase)
      .set({ content, updatedAt: sql`now()` })
      .where(eq(knowledgeBase.id, existing.id));
    return "updated";
  }

  await db.insert(knowledgeBase).values({
    title: sheet.title,
    content,
    category: sheet.category,
    sourceUrl: sheet.url,
    sourceType: sheet.sourceType,
    tags: [sheet.sourceType],
    status: "published",
    createdBy: adminId,
  });
  return "created";
}

/** Sync all configured Google Sheets into the knowledge_base table */
export async function syncAllSheets(): Promise<SyncResult> {
  const adminId = await resolveAdminUserId();
  let created = 0;
  let updated = 0;

  for (const sheet of SHEETS) {
    try {
      const csv = await fetchCsv(sheet.url);
      const rows = parseCsv(csv);
      if (rows.length <= 1) continue; // empty or header-only sheet

      const content = csvToMarkdown(rows);
      const result = await upsertArticle(sheet, content, adminId);
      if (result === "created") created++;
      else updated++;
    } catch (err) {
      console.error(`[sheets-sync] Failed to sync "${sheet.title}":`, err);
    }
  }

  return { created, updated };
}
