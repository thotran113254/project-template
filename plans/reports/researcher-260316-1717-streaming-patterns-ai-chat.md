# AI Chat Streaming Patterns Research Report

**Date:** 2026-03-16
**Stack:** Hono.js + @google/genai SDK + React 19 + TanStack Query + Axios
**Problem:** Current non-streaming implementation causes 10-60s wait with full response received at once

---

## Executive Summary

**Recommended Pattern:** Server-Sent Events (SSE) via Hono.js streaming helper + Fetch EventSource on frontend.

**Why:** Simplest implementation for one-directional server→client streaming, auto-reconnection, native browser support, perfect fit for token-by-token AI responses. Scales better than WebSockets for this use case. Avoids Axios limitations with streaming.

**Implementation Complexity:** Low. Estimated 4-6 hours full integration (backend streaming + frontend EventSource + DB persistence).

---

## 1. @google/genai SDK Streaming Capabilities

### Available Method
- **Method:** `chat.sendMessageStream()`
- **Current Version:** @google/genai ^1.45.0 (already in your package.json)
- **Return Type:** `AsyncGenerator<GenerateContentResponse>` - yields chunks as they arrive

### API Pattern
```typescript
// Example from @google/genai docs
const chat = client.chats.create({ model: 'gemini-3-flash-preview', config: {...} });
const stream = await chat.sendMessageStream({ message: "User message" });

for await (const chunk of stream) {
  console.log(chunk.text); // Access token-by-token text
}
```

### Token-by-Token Access
Each chunk has:
- `chunk.text` - Accumulated text so far
- `chunk.data` - Raw response data
- Useful for showing incremental tokens in real-time

### Status
✅ Streaming is fully supported and documented at: https://googleapis.github.io/js-genai/release_docs/classes/chats.Chat.html

---

## 2. Hono.js Streaming Response Helpers

### Available Options

#### A. Server-Sent Events (SSE) - **RECOMMENDED**
```typescript
// Hono built-in helper
import { streamSSE } from 'hono/streaming';

app.post('/api/v1/chat/stream', async (c) => {
  return streamSSE(c, async (stream) => {
    // Your AI streaming logic here
    await stream.writeSSE({
      data: JSON.stringify({ text: chunk }),
      event: 'text-delta',
      id: String(tokenCount++)
    });
  });
});
```

**Benefits:**
- Sets `Content-Type: text/event-stream` automatically
- Handles connection closing automatically
- Auto-reconnection built into browser EventSource API
- Works with Hono middleware (auth)
- Lower overhead than WebSockets

**Limitations:**
- Unidirectional (server→client only). Fine for AI chat since user send = new request.

#### B. Plain Text Streaming
```typescript
import { streamText } from 'hono/streaming';

return streamText(c, async (stream) => {
  await stream.write('chunk data');
  await stream.writeln('text with newline');
});
```

**Pros:** Simpler than SSE, direct text output
**Cons:** Less structured, harder to parse chunks on frontend, no built-in reconnection

#### C. Raw Response Body (Lower-level)
Hono also supports raw streaming via native Node.js response object, but less convenient.

### Recommendation
**Use `streamSSE()`** - built-in support, auto-reconnection, structured events, cleanest API.

**Reference:** https://hono.dev/docs/helpers/streaming

---

## 3. Frontend Streaming Patterns

### Option A: EventSource API + SSE - **SIMPLEST**
```typescript
// Frontend - React hook
function useChatStream(sessionId: string, content: string) {
  const [chunks, setChunks] = useState<string[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);

  const startStream = useCallback(async () => {
    setIsStreaming(true);
    setChunks([]);

    const es = new EventSource(
      `/api/v1/chat/sessions/${sessionId}/messages?content=${encodeURIComponent(content)}`,
      { headers: { 'Authorization': `Bearer ${token}` } }
    );

    es.addEventListener('text-delta', (event) => {
      const chunk = JSON.parse(event.data).text;
      setChunks(prev => [...prev, chunk]);
    });

    es.addEventListener('done', () => {
      es.close();
      setIsStreaming(false);
      // Save full response to DB here
    });

    es.addEventListener('error', () => {
      es.close();
      setIsStreaming(false);
    });
  }, [sessionId, content, token]);

  return { chunks: chunks.join(''), isStreaming, startStream };
}
```

**Pros:**
- Native browser API (no extra library)
- Auto-reconnection with configurable retry
- Works with CORS/auth headers (EventSource API v2)
- Clean event model
- Perfect for unidirectional streaming

**Cons:**
- POST requests not directly supported (use GET with query params or emit via message event)
- No way to send stop signal over same connection (use separate HTTP call)

### Option B: Fetch + ReadableStream - **MORE CONTROL**
```typescript
const response = await fetch('/api/v1/chat/stream', {
  method: 'POST',
  body: JSON.stringify({ content }),
  headers: { 'Authorization': `Bearer ${token}` }
});

const reader = response.body?.getReader();
if (!reader) throw new Error('Stream not supported');

let accumulatedText = '';
while (true) {
  const { done, value } = await reader.read();
  if (done) break;

  const chunk = new TextDecoder().decode(value);
  accumulatedText += chunk;

  // Parse SSE format manually or plain text
  setResponseText(accumulatedText);
}
```

**Pros:**
- Works with POST (send message in body)
- Finer control over chunking
- Can handle any response format

**Cons:**
- No built-in reconnection (must implement manually)
- Manual SSE parsing needed
- More boilerplate

### Option C: Axios - **NOT RECOMMENDED FOR STREAMING**
Axios doesn't support streaming responses well:
- `responseType: 'stream'` returns Node.js stream (not available in browser)
- No native ReadableStream support like fetch
- Progress callback doesn't give readable chunks for text parsing

**Skip Axios for streaming.** Use native Fetch API or keep Axios for non-streaming calls.

### Recommendation
**Use EventSource API with SSE backend.** Simplest, native reconnection, minimal code.

**Reference:** https://developer.mozilla.org/en-US/docs/Web/API/EventSource

---

## 4. Pattern Comparison Matrix

| Aspect | SSE + EventSource | Fetch + ReadableStream | WebSocket |
|--------|------------------|----------------------|-----------|
| **Complexity** | Low ⭐ | Medium | High |
| **Browser Support** | 95%+ | 98%+ | 98%+ |
| **Auto-Reconnect** | Yes (built-in) | Manual | Manual |
| **Bidirectional** | No (server→client) | No (per request) | Yes |
| **DB Persistence** | Easy | Easy | Harder (persistent conn) |
| **Firewall/Proxy** | HTTP friendly | HTTP friendly | Requires upgrade |
| **Hono Support** | `streamSSE()` native | Via response streaming | Via middleware |
| **Error Recovery** | Built-in retry | Custom logic | Custom logic |
| **Use Case** | ✅ AI token streaming | ✅ AI token streaming | ❌ Overkill for one-way |

**Verdict:** SSE wins for AI chat. WebSocket only if you need real-time bidirectional features (e.g., user interrupts generation mid-stream).

---

## 5. Database Persistence with Streaming

### Challenge
Stream starts before full response is available. Need to:
1. Show tokens in real-time to user
2. Save complete final response to DB
3. Handle interrupted streams (partial responses)

### Solution Pattern A: Accumulate + Save After (RECOMMENDED)
```typescript
// Backend
app.post('/api/v1/chat/stream', async (c) => {
  const { sessionId, content } = await c.req.json();
  let fullResponse = '';

  // Save user message first
  await db.insert(chatMessages).values({
    sessionId, role: 'user', content
  });

  return streamSSE(c, async (stream) => {
    const chat = client.chats.create({ model: 'gemini-3-flash-preview', ... });

    for await (const chunk of chat.sendMessageStream({ message: content })) {
      fullResponse += chunk.text;

      await stream.writeSSE({
        data: JSON.stringify({ text: chunk.text }),
        event: 'text-delta'
      });
    }

    // After stream ends, save complete response
    await db.insert(chatMessages).values({
      sessionId,
      role: 'assistant',
      content: fullResponse
    });

    await stream.writeSSE({ event: 'done' });
  });
});
```

**Pros:**
- Simplest code
- One DB write per response (efficient)
- Stream flows cleanly

**Cons:**
- If connection closes mid-stream, response is lost
- Can't recover partial response

### Solution Pattern B: Buffered Writes (PRODUCTION)
```typescript
// Write to DB every 500ms or every 500 chars
const FLUSH_INTERVAL = 500; // ms
const FLUSH_SIZE = 500; // chars
let buffer = '';
let lastFlush = Date.now();

for await (const chunk of stream) {
  fullResponse += chunk.text;
  buffer += chunk.text;

  const shouldFlush =
    buffer.length >= FLUSH_SIZE ||
    Date.now() - lastFlush > FLUSH_INTERVAL;

  if (shouldFlush && buffer.length > 0) {
    // Append to existing draft record or create new
    await db.update(chatMessages).set({
      content: fullResponse,
      metadata: { status: 'streaming', timestamp: new Date() }
    });
    buffer = '';
    lastFlush = Date.now();
  }

  await stream.writeSSE({ data: JSON.stringify({ text: chunk.text }) });
}
```

**Pros:**
- Survives connection loss (partial recovery)
- Balanced DB load
- Can show "saving..." indicator in UI

**Cons:**
- Slightly more complex
- Multiple DB writes

### Solution Pattern C: Two-Phase (COMPLEX)
1. Stream response as draft to DB (periodic writes)
2. Finalize record when stream ends or on client-side confirmation

**Use only if:** Need to preserve partial responses + show recovery UI.

### Recommendation
**Pattern A (Accumulate + Save)** for MVP. Upgrade to Pattern B if stream interruptions become problematic.

---

## 6. Error Recovery & Edge Cases

### Streaming Interruption
**Frontend (EventSource):**
- Browser automatically reconnects with exponential backoff
- Set `event: retry: 5000` on backend to customize retry interval
- Server can refuse reconnection or return cached/partial response

**Frontend (Fetch):**
- No auto-reconnect; must implement manually
- Catch `AbortError` and retry if desired

**Backend (Node.js):**
- Stream errors on reading Gemini response → error event fires
- Close stream gracefully: `stream.close()`
- Unfinished message won't be saved if using Pattern A

### Network Loss During Streaming
- **SSE:** Browser waits for retry timeout, then reconnects
- **Fetch:** Stream stops; no recovery unless implemented
- **Solution:** Show "Connection lost, retrying..." → resume from last chunk ID

### Partial Response Persistence
- If using Pattern B (buffered writes), partial response exists in DB
- Mark with metadata flag: `{ status: 'incomplete', lastUpdate: timestamp }`
- UX: Show partial response to user with "This response was interrupted" notice

---

## 7. Complete Implementation Example

### Backend (Hono)
```typescript
// apps/api/src/modules/chat/chat-streaming-service.ts
import { streamSSE } from 'hono/streaming';
import { GoogleGenAI } from '@google/genai';

export async function streamChatResponse(
  c: any,
  sessionId: string,
  userId: string,
  userContent: string
) {
  // Auth + validate session
  const [session] = await db.select().from(chatSessions)
    .where(eq(chatSessions.id, sessionId));
  if (!session || session.userId !== userId) throw new HTTPException(403);

  // Save user message
  await db.insert(chatMessages).values({
    sessionId, role: 'user', content: userContent
  });

  // Stream response
  return streamSSE(c, async (stream) => {
    const client = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
    let fullResponse = '';
    let tokenCount = 0;

    try {
      // Build context (market data + KB)
      const kbContext = await buildKbContext();
      const history = await fetchConversationHistory(sessionId);

      // Create chat and stream
      const chat = client.chats.create({
        model: 'gemini-3-flash-preview',
        config: { systemInstruction: buildSystemPrompt(kbContext) },
        history: history.map(m => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content }]
        }))
      });

      const stream_response = await chat.sendMessageStream({
        message: userContent
      });

      for await (const chunk of stream_response) {
        const text = chunk.text ?? '';
        fullResponse += text;
        tokenCount++;

        await stream.writeSSE({
          data: JSON.stringify({
            text,
            tokenCount
          }),
          event: 'text-delta',
          id: String(tokenCount)
        });
      }

      // Save complete response
      await db.insert(chatMessages).values({
        sessionId,
        role: 'assistant',
        content: fullResponse,
        metadata: { tokenCount }
      });

      // Send completion event
      await stream.writeSSE({ event: 'done', data: '{}' });

    } catch (error) {
      await stream.writeSSE({
        event: 'error',
        data: JSON.stringify({
          message: error instanceof Error ? error.message : 'Unknown error'
        })
      });
    }
  });
}
```

### Route
```typescript
// apps/api/src/modules/chat/chat-routes.ts
chatRoutes.post('/sessions/:id/messages/stream', async (c) => {
  const user = c.get('user');
  const { content } = await c.req.json();

  return streamChatResponse(c, c.req.param('id'), user.sub, content);
});
```

### Frontend (React)
```typescript
// apps/web/src/hooks/use-chat-stream.ts
import { useCallback, useRef, useState } from 'react';

export function useChatStream(sessionId: string, token: string) {
  const [displayText, setDisplayText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  const stream = useCallback(
    (userContent: string) => {
      setIsStreaming(true);
      setError(null);
      setDisplayText('');

      // Fetch to send initial message (POST)
      fetch(`/api/v1/chat/sessions/${sessionId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ content: userContent })
      })
        .then(res => {
          if (!res.ok) throw new Error('Failed to start stream');

          // Get response as stream
          const reader = res.body?.getReader();
          if (!reader) throw new Error('Streaming not supported');

          return (async () => {
            let accumulated = '';
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              const chunk = new TextDecoder().decode(value);
              accumulated += chunk;
              setDisplayText(accumulated);
            }
            setIsStreaming(false);
          })();
        })
        .catch(err => {
          setError(err.message);
          setIsStreaming(false);
        });
    },
    [sessionId, token]
  );

  return { displayText, isStreaming, error, stream };
}
```

**Alternative (EventSource for GET-based stream):**
```typescript
const startStream = (userContent: string) => {
  const params = new URLSearchParams({
    content: userContent
  });

  const es = new EventSource(
    `/api/v1/chat/sessions/${sessionId}/messages/stream?${params}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  es.addEventListener('text-delta', (evt) => {
    const { text } = JSON.parse(evt.data);
    setDisplayText(prev => prev + text);
  });

  es.addEventListener('done', () => {
    es.close();
    setIsStreaming(false);
  });

  es.addEventListener('error', () => {
    es.close();
    setError('Stream interrupted');
    setIsStreaming(false);
  });
};
```

---

## 8. Migration Path (Current → Streaming)

### Phase 1: Add Streaming Endpoint (2 hours)
1. Create `chat-streaming-service.ts` with `streamChatResponse()`
2. Add POST `/chat/sessions/:id/messages/stream` route
3. Keep existing `/messages` route working

### Phase 2: Update Frontend (2 hours)
1. Create `use-chat-stream` hook
2. Add "Stream response" toggle or new chat page variant
3. Test with existing backend

### Phase 3: Remove Old Endpoint (1 hour)
1. Migrate all UI to streaming version
2. Delete old `sendMessage()` from chat-service.ts
3. Remove non-streaming route

### Phase 4: Polish (1-2 hours)
1. Add connection loss indicators
2. Implement retry logic
3. Error boundaries + fallback UI

**Total effort:** 4-6 hours

---

## 9. Key Differences from Current Implementation

| Aspect | Current | Streaming |
|--------|---------|-----------|
| **Response Time** | 10-60s wait, then instant display | Immediate token display |
| **UX Feel** | "Loading..." spinner, then text dump | Typewriter effect, real-time |
| **Backend Pattern** | Wait for full response, save, return | Save user msg, stream tokens, save accumulated |
| **Database Calls** | 2 writes (user + AI response) | Same 2 writes |
| **Frontend Mutation** | Single `useMutation` with 120s timeout | Event listener-based, auto-retry |
| **Error Handling** | User sees error after 60s | User sees error as it happens |
| **Partial Responses** | Lost if error | Can be recovered (with buffering) |

---

## 10. Why Not These Patterns?

### WebSocket
- **Overkill.** AI chat is mostly server→client. WebSocket shines for bidirectional games/collaboration.
- **Complexity:** Need connection pool, heartbeat, reconnection logic
- **Firewall issues:** Some proxies block WebSocket upgrade

### Polling
- **Wasteful.** Hundreds of HTTP requests for single response stream
- **Latency:** 1-5s delay between polls vs real-time streaming

### GraphQL Subscriptions
- **Unnecessary dependency.** GraphQL adds complexity for simple token streaming
- **Stick with REST:** Your stack is already REST + JSON

### Axios Response Streams
- **Not designed for browser.** Axios streams = Node.js Readable streams
- **Workaround required.** Can't read chunks in browser easily

---

## 11. Production Checklist

Before shipping to production:

- [ ] **Timeouts:** Set Hono response timeout > max expected stream duration
- [ ] **Backpressure:** Ensure Gemini API streaming doesn't block event loop
- [ ] **Memory:** Long streams shouldn't accumulate unbounded chunks
- [ ] **Logging:** Log stream start/end/errors for observability
- [ ] **Monitoring:** Track average stream duration, chunk size, error rates
- [ ] **Metrics:** Monitor EventSource reconnection frequency
- [ ] **Rate limiting:** Prevent single user from spamming stream requests
- [ ] **Token budgets:** Ensure Gemini API quota sufficient for peak load
- [ ] **Graceful shutdown:** Server should close streams cleanly on restart
- [ ] **CORS:** If frontend on different domain, allow EventSource headers

---

## Sources

### Hono.js Streaming
- [Streaming Helpers - Hono Docs](https://hono.dev/docs/helpers/streaming)
- [Hono with Server Sent Events - DEV Community](https://dev.to/yanael/hono-with-server-sent-events-6gf)

### @google/genai SDK
- [Chat Streaming - googleapis/js-genai Docs](https://googleapis.github.io/js-genai/release_docs/classes/chats.Chat.html)
- [Google Generative AI NPM Package](https://www.npmjs.com/package/@google/genai)

### Frontend Streaming
- [EventSource API - MDN](https://developer.mozilla.org/en-US/docs/Web/API/EventSource)
- [ReadableStream API - MDN](https://developer.mozilla.org/en-US/docs/Web/API/ReadableStream)
- [Streaming Requests with Fetch - Chrome Docs](https://web.dev/fetch-upload-streaming)

### Pattern Comparison
- [Server-Sent Events vs WebSockets - FreeCodeCamp](https://www.freecodecamp.org/news/server-sent-events-vs-websockets/)
- [WebSockets vs SSE - Blog Comparison](https://websocket.org/comparisons/sse/)
- [Go with SSE for AI Chat - sniki.dev](https://www.sniki.dev/posts/sse-vs-websockets-for-ai-chat/)

### Database Persistence
- [Persistent Text Streaming - Convex](https://www.convex.dev/components/persistent-text-streaming)
- [AI Chat with HTTP Streaming - stack.convex.dev](https://stack.convex.dev/ai-chat-with-http-streaming)

### TanStack Query & Streaming
- [streamedQuery - TanStack Query Docs](https://tanstack.com/query/v5/docs/reference/streamedQuery)

---

## Unresolved Questions

1. **Retry interval:** What's the optimal `retry: X` value for your users? (currently suggests 5000ms)
2. **Chunk size:** Should you buffer tokens (e.g., send every 50ms) or send per-token? Depends on Gemini API output rate.
3. **Metrics:** Do you need to track user engagement with streaming (e.g., % of users who read full response)?
4. **Persistence:** Should partial responses be visible in chat history? Recommend "no" until stream complete.
5. **Cost:** Does Gemini API charge differently for streaming vs. standard requests? (Likely same)

