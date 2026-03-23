# AI Chat & Markdown Rendering - Web Frontend Exploration

## Executive Summary
The web frontend currently has an AI chat system implemented but **has no markdown rendering library installed**. All AI responses are displayed as plain text in chat bubbles. This is a significant gap if the AI responses contain markdown formatting that needs to be rendered.

---

## 1. AI Chat Components Found

### Location: `/home/automation/project-template/apps/web/src/components/chat/`

#### Files:
1. **chat-page.tsx** - Main chat page component
   - Full-page AI travel assistant chat interface
   - Uses TanStack Query for session/message management
   - Supports optimistic message rendering
   - Routes: `/chat/sessions` (GET/POST), `/chat/sessions/{id}/messages` (GET/POST)

2. **chat-message-bubble.tsx** - Individual message display
   - Renders user/assistant messages with avatars
   - **Currently displays content as plain text**: `{content}`
   - No markdown parsing or rendering
   - Shows timestamp in Vietnamese format
   - Uses conditional styling for user vs assistant messages

3. **chat-input.tsx** - Message input bar
   - Text input with Enter-to-send
   - Vietnamese placeholder: "Hỏi AI về khách sạn..."
   - Teal-themed send button with Lucide icon

4. **chat-suggestion-chips.tsx** - Quick reply buttons
   - Hard-coded Vietnamese suggestions
   - No dynamic suggestion loading

### Related Page:
- **ai-settings-page.tsx** - Admin settings to control which data categories AI can access

---

## 2. Current Response Display Method

In `chat-message-bubble.tsx` (line 53):
```tsx
<div className="rounded-2xl px-4 py-2.5 text-sm leading-relaxed">
  {content}
</div>
```

**Key Finding**: Content is rendered directly as plain text. No HTML, markdown, or formatted rendering.

---

## 3. Markdown & Formatting Dependencies

### Package.json Analysis
Location: `/home/automation/project-template/apps/web/package.json`

#### Current Dependencies:
- react@^18.3.1
- react-dom@^18.3.1
- react-hook-form@^7.71.2
- @tanstack/react-query@^5.62.0
- axios@^1.7.9
- framer-motion@^12.34.4
- lucide-react@^0.468.0
- tailwind-merge@^2.5.5
- class-variance-authority@^0.7.1
- clsx@^2.1.1
- react-router-dom@^6.28.1
- @app/shared (workspace)

#### Missing Markdown Libraries:
- ❌ `react-markdown`
- ❌ `marked`
- ❌ `remark`
- ❌ `rehype`
- ❌ `html-to-text`
- ❌ `sanitize-html`
- ❌ `dompurify`
- ❌ `commonmark`

#### Code Patterns Search:
- No `dangerouslySetInnerHTML` found in codebase
- No `innerHTML` manipulation found
- No HTML sanitization utilities found

---

## 4. How AI Responses Are Currently Displayed

### Flow:
1. User sends message via `ChatInput`
2. Message sent to API: `POST /chat/sessions/{sessionId}/messages`
3. API returns both user and AI messages as `ChatMessage[]`
4. Messages stored in React Query cache with structure:
   ```typescript
   interface ChatMessage {
     id: string
     sessionId: string
     role: "user" | "system" | "assistant"
     content: string          // Plain text only
     metadata: object
     createdAt: string
   }
   ```
5. `ChatMessageBubble` renders content directly with `{content}`

### Styling Applied:
- Teal background for assistant (role === "assistant")
- Gray background for user (role === "user")
- Vietnamese locale time formatting
- Avatar icons (Bot for assistant, User for user)
- Max width 75% of container

---

## 5. Related Knowledge Base Component

File: `/home/automation/project-template/apps/web/src/components/knowledge-base/kb-article-modal.tsx`

- KB articles stored with `content` field (plain text)
- No markdown rendering in display
- Edit/create form uses plain `Textarea`
- No preview functionality

---

## 6. Market Data Components

These components display property/market data but also use plain text:
- property-detail-dialog.tsx: Uses `whitespace-pre-line` CSS for line breaks
- Various tabs display data as plain text fields

---

## 7. Potential Rendering Issues

### Current Limitations:
1. **No bold/italic formatting** in AI responses
2. **No lists** (bullets/numbered)
3. **No code blocks** (critical for technical content)
4. **No links** (can't add clickable URLs)
5. **No tables** or structured data visualization
6. **No headings** to organize content
7. **Whitespace-only formatting** via `whitespace-pre-line`

### If AI Returns Markdown:
```markdown
## Hotels in Da Lat

1. **Luxury Palace Hotel**
   - 5 stars
   - Price: $150/night

2. Visit our [website](http://example.com)
```

Current display would show raw markdown syntax to users.

---

## 8. File Inventory Summary

### Chat-Related Files (Main):
- `/home/automation/project-template/apps/web/src/pages/chat-page.tsx`
- `/home/automation/project-template/apps/web/src/components/chat/chat-message-bubble.tsx`
- `/home/automation/project-template/apps/web/src/components/chat/chat-input.tsx`
- `/home/automation/project-template/apps/web/src/components/chat/chat-suggestion-chips.tsx`

### Related Files:
- `/home/automation/project-template/apps/web/src/pages/ai-settings-page.tsx`
- `/home/automation/project-template/apps/web/src/components/knowledge-base/kb-article-modal.tsx`
- `/home/automation/project-template/apps/web/package.json`

---

## 9. Recommendations for Markdown Support

### Option A: Lightweight
- Add `markdown-it` + simple CSS for styling
- Minimal dependencies

### Option B: Full Featured
- Add `react-markdown` + `rehype-sanitize` + `remark-gfm`
- Best for complex markdown with tables, strikethrough, etc.

### Option C: Simple HTML
- Add `dompurify` for safe HTML rendering
- If backend already converts markdown → HTML

---

## Unresolved Questions
- Does the backend AI service return markdown formatted responses?
- Should KB articles support markdown formatting?
- Are there security requirements for HTML/markdown content?
- What markdown features are actually needed (tables, code, links, etc.)?
