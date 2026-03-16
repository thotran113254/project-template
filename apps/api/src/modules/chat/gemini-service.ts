import { GoogleGenAI } from "@google/genai";
import { env } from "../../env.js";

const SYSTEM_INSTRUCTIONS = `
Bạn là AI Travel Assistant chuyên về du lịch Việt Nam cho nhân viên sale. Trả lời dựa trên DỮ LIỆU THỰC TẾ bên dưới.

## QUY TẮC
1. Khi tính giá: dùng BẢNG GIÁ CHÍNH XÁC trong dữ liệu, áp dụng quy tắc giá (trẻ em, phụ thu)
2. Khi so sánh: dùng bảng đánh giá tiêu chí (nếu có)
3. Khi gợi ý lịch trình: dùng LỊCH TRÌNH MẪU, tùy chỉnh theo yêu cầu KH
4. Nếu không có dữ liệu: nói rõ "chưa có thông tin trong hệ thống"
5. Trả lời bằng tiếng Việt, chuyên nghiệp, thân thiện
6. Khi quote giá: LUÔN ghi rõ loại combo, loại ngày, số người tiêu chuẩn

## KNOWLEDGE BASE (Dữ liệu thực tế từ hệ thống)
`;

type MessageRole = "user" | "assistant";

interface ChatMessage {
  role: MessageRole;
  content: string;
}

/** Map our role names to Gemini's role format */
function toGeminiRole(role: MessageRole): "user" | "model" {
  return role === "assistant" ? "model" : "user";
}

let genai: GoogleGenAI | null = null;

function getClient(): GoogleGenAI {
  if (!genai) {
    if (!env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not configured");
    }
    genai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
  }
  return genai;
}

/**
 * Generate a chat response using Gemini 3.0 Flash Preview with KB context.
 * @param messages - Conversation history (role + content pairs)
 * @param kbContext - Knowledge base articles concatenated as context
 */
export async function generateChatResponse(
  messages: ChatMessage[],
  kbContext: string,
): Promise<string> {
  const client = getClient();

  const systemPrompt = SYSTEM_INSTRUCTIONS + "\n" + kbContext;

  // Build Gemini content history (all but the last message)
  const history = messages.slice(0, -1).map((m) => ({
    role: toGeminiRole(m.role),
    parts: [{ text: m.content }],
  }));

  const lastMessage = messages[messages.length - 1];
  if (!lastMessage) throw new Error("No messages provided");

  const chat = client.chats.create({
    model: "gemini-3-flash-preview",
    config: { systemInstruction: systemPrompt },
    history,
  });

  const response = await chat.sendMessage({
    message: lastMessage.content,
  });

  return response.text ?? "";
}
