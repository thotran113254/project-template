import { eq, and, ilike, or } from "drizzle-orm";
import { db } from "../../db/connection.js";
import { knowledgeBase } from "../../db/schema/index.js";

/** Search published KB articles by title / category / content, or return top 10 if no query */
export async function fetchKnowledgeBaseArticles(query?: string): Promise<string> {
  const baseWhere = eq(knowledgeBase.status, "published");
  const selectFields = {
    title: knowledgeBase.title,
    content: knowledgeBase.content,
    category: knowledgeBase.category,
  };

  const articles = query
    ? await db
        .select(selectFields)
        .from(knowledgeBase)
        .where(
          and(
            baseWhere,
            or(
              ilike(knowledgeBase.title, `%${query}%`),
              ilike(knowledgeBase.category, `%${query}%`),
              ilike(knowledgeBase.content, `%${query}%`),
            ),
          ),
        )
        .limit(5)
    : await db
        .select(selectFields)
        .from(knowledgeBase)
        .where(baseWhere)
        .limit(10);

  if (articles.length === 0) return "(Không tìm thấy bài viết liên quan)";
  return articles
    .map((a) => `### [${a.category.toUpperCase()}] ${a.title}\n${a.content}`)
    .join("\n\n---\n\n");
}
