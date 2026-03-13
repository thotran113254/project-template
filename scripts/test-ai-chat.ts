/**
 * Test script for Gemini AI chat integration.
 * Usage: API_URL=http://localhost:3010/api/v1 pnpm exec tsx scripts/test-ai-chat.ts
 */

const API_BASE = process.env["API_URL"] ?? "http://localhost:3001/api/v1";

// ─── Auth ────────────────────────────────────────────────────────────────────

async function login(email: string, password: string): Promise<string> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = (await res.json()) as { data?: { tokens?: { accessToken?: string }; accessToken?: string } };
  const token = data.data?.tokens?.accessToken ?? data.data?.accessToken;
  if (!token) throw new Error(`Login failed: ${JSON.stringify(data)}`);
  return token;
}

// ─── KB Sync ─────────────────────────────────────────────────────────────────

async function triggerSync(adminToken: string): Promise<void> {
  console.log("\n[1/1] Syncing Google Sheets → Knowledge Base...");
  const res = await fetch(`${API_BASE}/knowledge-base/sync`, {
    method: "POST",
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const data = await res.json();
  console.log("Sync result:", JSON.stringify(data));
}

// ─── Chat helpers ─────────────────────────────────────────────────────────────

async function createSession(token: string): Promise<string> {
  const res = await fetch(`${API_BASE}/chat/sessions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ title: "AI Test Session" }),
  });
  const data = (await res.json()) as { data?: { id?: string } };
  const id = data.data?.id;
  if (!id) throw new Error(`Session creation failed: ${JSON.stringify(data)}`);
  return id;
}

async function chat(
  token: string,
  sessionId: string,
  message: string,
): Promise<string> {
  const res = await fetch(`${API_BASE}/chat/sessions/${sessionId}/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ content: message }),
  });
  const data = (await res.json()) as { data?: Array<{ role: string; content: string }> };
  const assistant = data.data?.find((m) => m.role === "assistant");
  return assistant?.content ?? "(no response)";
}

// ─── Test scenarios ───────────────────────────────────────────────────────────

const TEST_SCENARIOS = [
  "So sánh ưu nhược điểm giữa 2 homestay Cat Ba",
  "Phòng có bồn tắm lộ thiên kín đáo ở Sa Pa",
  "Lịch trình tuần trăng mật Phú Quốc 4 ngày",
  "Hoa tam giác mạch Hà Giang và chỗ chụp ảnh cho xe 29 chỗ",
  "Tính giá: 3 người lớn, 2 trẻ em (5 tuổi, 11 tuổi), 3N2Đ tại homestay, thứ 6",
  "Phụ thu tuyến Hạ Long -> Sa Pa là bao nhiêu?",
  "Combo Sa Pa dưới 990k/người có những gói nào?",
  "Combo 3N2Đ 2 khách sạn khác nhau cho 2 người tính thế nào?",
];

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log("=== AI Chat Integration Test ===\n");

  const adminToken = await login("admin@example.com", "Admin123!");
  console.log("✓ Admin logged in");

  await triggerSync(adminToken);

  const userToken = await login("user@example.com", "User123!");
  console.log("✓ User logged in");

  const sessionId = await createSession(userToken);
  console.log(`✓ Chat session created: ${sessionId}\n`);

  let passed = 0;
  let failed = 0;

  for (let i = 0; i < TEST_SCENARIOS.length; i++) {
    const question = TEST_SCENARIOS[i]!;
    console.log(`\n─── Scenario ${i + 1}/${TEST_SCENARIOS.length} ───`);
    console.log(`Q: ${question}`);
    try {
      const answer = await chat(userToken, sessionId, question);
      console.log(`A: ${answer.slice(0, 300)}${answer.length > 300 ? "..." : ""}`);
      passed++;
    } catch (err) {
      console.error(`✗ Error:`, err);
      failed++;
    }
  }

  console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
