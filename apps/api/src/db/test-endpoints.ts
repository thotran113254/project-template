const BASE = "http://localhost:3001/api/v1";

interface TestResult {
  name: string;
  status: "PASS" | "FAIL";
  detail?: string;
}

const results: TestResult[] = [];

async function api(
  method: string,
  path: string,
  body?: unknown,
  token?: string,
): Promise<{ ok: boolean; data: Record<string, unknown>; status: number }> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = (await res.json()) as Record<string, unknown>;
  return { ok: res.ok, data, status: res.status };
}

function check(name: string, res: { ok: boolean; data: Record<string, unknown> }) {
  if (res.ok && (res.data as { success?: boolean }).success) {
    results.push({ name, status: "PASS" });
    console.log(`  PASS | ${name}`);
  } else {
    const msg = JSON.stringify(res.data).slice(0, 200);
    results.push({ name, status: "FAIL", detail: msg });
    console.log(`  FAIL | ${name} | ${msg}`);
  }
}

async function run() {
  console.log("=== Auth Endpoints ===");

  // Login admin
  const adminLogin = await api("POST", "/auth/login", {
    email: "admin@example.com",
    password: "Admin123!",
  });
  check("POST /auth/login (admin)", adminLogin);
  const adminToken = (adminLogin.data as { data?: { tokens?: { accessToken?: string } } })
    .data?.tokens?.accessToken ?? "";

  // Login user
  const userLogin = await api("POST", "/auth/login", {
    email: "user@example.com",
    password: "User123!",
  });
  check("POST /auth/login (user)", userLogin);
  const userToken = (userLogin.data as { data?: { tokens?: { accessToken?: string } } })
    .data?.tokens?.accessToken ?? "";

  // GET /auth/me
  const adminMe = await api("GET", "/auth/me", undefined, adminToken);
  check("GET /auth/me (admin)", adminMe);

  const userMe = await api("GET", "/auth/me", undefined, userToken);
  check("GET /auth/me (user)", userMe);

  console.log("\n=== Hotels Endpoints ===");

  // GET /hotels
  const hotelsList = await api("GET", "/hotels", undefined, adminToken);
  check("GET /hotels", hotelsList);

  // Extract a hotel slug and id
  const hotelsData = (hotelsList.data as { data?: { id: string; slug: string }[] }).data ?? [];
  const firstHotel = hotelsData[0];

  // GET /hotels/slug/:slug
  const hotelBySlug = await api("GET", `/hotels/slug/${firstHotel?.slug}`, undefined, adminToken);
  check("GET /hotels/slug/:slug", hotelBySlug);

  const hotelId = (hotelBySlug.data as { data?: { id: string } }).data?.id ?? "";

  // GET /hotels/:id
  const hotelById = await api("GET", `/hotels/${hotelId}`, undefined, adminToken);
  check("GET /hotels/:id", hotelById);

  // GET /hotels/:id/rooms
  const rooms = await api("GET", `/hotels/${hotelId}/rooms`, undefined, adminToken);
  check("GET /hotels/:id/rooms", rooms);
  const roomsData = (rooms.data as { data?: { id: string }[] }).data ?? [];
  const roomId = roomsData[0]?.id ?? "";

  console.log("\n=== Bookings Endpoints ===");

  // GET /bookings
  const bookingsList = await api("GET", "/bookings", undefined, adminToken);
  check("GET /bookings (admin)", bookingsList);

  // POST /bookings
  const newBooking = await api(
    "POST",
    "/bookings",
    {
      hotelId,
      roomId,
      checkIn: "2026-07-01",
      checkOut: "2026-07-05",
      guests: 2,
      notes: "Test booking from endpoint test",
    },
    userToken,
  );
  check("POST /bookings", newBooking);
  const bookingId = (newBooking.data as { data?: { id: string } }).data?.id ?? "";

  // PATCH /bookings/:id
  const updatedBooking = await api(
    "PATCH",
    `/bookings/${bookingId}`,
    { status: "confirmed", notes: "Updated via test" },
    userToken,
  );
  check("PATCH /bookings/:id", updatedBooking);

  console.log("\n=== Chat Endpoints ===");

  // POST /chat/sessions
  const newSession = await api(
    "POST",
    "/chat/sessions",
    { title: "Test chat session" },
    userToken,
  );
  check("POST /chat/sessions", newSession);
  const sessionId = (newSession.data as { data?: { id: string } }).data?.id ?? "";

  // GET /chat/sessions
  const sessionsList = await api("GET", "/chat/sessions", undefined, userToken);
  check("GET /chat/sessions", sessionsList);

  // POST /chat/sessions/:id/messages
  const newMsg = await api(
    "POST",
    `/chat/sessions/${sessionId}/messages`,
    { content: "Hello, recommend a hotel in Da Nang?" },
    userToken,
  );
  check("POST /chat/sessions/:id/messages", newMsg);

  // GET /chat/sessions/:id/messages
  const msgList = await api(
    "GET",
    `/chat/sessions/${sessionId}/messages`,
    undefined,
    userToken,
  );
  check("GET /chat/sessions/:id/messages", msgList);

  console.log("\n=== Knowledge Base Endpoints ===");

  // GET /knowledge-base
  const kbList = await api("GET", "/knowledge-base", undefined, adminToken);
  check("GET /knowledge-base", kbList);

  // POST /knowledge-base
  const newKb = await api(
    "POST",
    "/knowledge-base",
    {
      title: "Test KB Article",
      content: "Test knowledge base content.",
      category: "general",
      tags: ["test", "qa"],
      status: "draft",
    },
    adminToken,
  );
  check("POST /knowledge-base", newKb);
  const kbId = (newKb.data as { data?: { id: string } }).data?.id ?? "";

  // PATCH /knowledge-base/:id
  const updatedKb = await api(
    "PATCH",
    `/knowledge-base/${kbId}`,
    { title: "Updated Test KB", status: "published" },
    adminToken,
  );
  check("PATCH /knowledge-base/:id", updatedKb);

  console.log("\n=== Pricing Endpoints ===");

  // GET /pricing/rules
  const rulesList = await api("GET", "/pricing/rules", undefined, adminToken);
  check("GET /pricing/rules", rulesList);

  // POST /pricing/rules
  const newRule = await api(
    "POST",
    "/pricing/rules",
    {
      hotelId,
      name: "Test Pricing Rule",
      seasonStart: "2026-09-01",
      seasonEnd: "2026-09-30",
      multiplier: 1.25,
      minNights: 2,
      adminNotes: "Created by endpoint test",
    },
    adminToken,
  );
  check("POST /pricing/rules", newRule);

  // POST /pricing/calculate
  const calcPrice = await api(
    "POST",
    "/pricing/calculate",
    {
      hotelId,
      roomId,
      checkIn: "2026-07-01",
      checkOut: "2026-07-05",
      guests: 2,
    },
    userToken,
  );
  check("POST /pricing/calculate", calcPrice);

  // --- Summary ---
  const passed = results.filter((r) => r.status === "PASS").length;
  const failed = results.filter((r) => r.status === "FAIL").length;

  console.log("\n===============================");
  console.log("  API ENDPOINT TEST RESULTS");
  console.log("===============================");
  for (const r of results) {
    if (r.status === "FAIL") {
      console.log(`  ${r.status} | ${r.name} | ${r.detail}`);
    } else {
      console.log(`  ${r.status} | ${r.name}`);
    }
  }
  console.log("-------------------------------");
  console.log(`  PASS: ${passed}  |  FAIL: ${failed}`);
  console.log("===============================");

  if (failed > 0) process.exit(1);
}

run().catch((err) => {
  console.error("Test script error:", err);
  process.exit(1);
});
