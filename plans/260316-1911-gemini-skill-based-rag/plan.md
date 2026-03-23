---
title: "Gemini Skill-Based Multi-Model RAG Pipeline"
description: "Replace full context dump with tool-calling orchestrator + cheap model data processor"
status: pending
priority: P1
effort: 8h
branch: main
tags: [ai, gemini, rag, refactor, tools, skills]
created: 2026-03-16
---

# Gemini Skill-Based Multi-Model RAG Pipeline

## Overview

Replace the current "dump everything" Gemini approach with a multi-model RAG pipeline where:
- **Main model** (`gemini-3-flash-preview`) orchestrates via function calling tools
- **Cheap model** (`gemini-2.5-flash-lite`) processes raw data using skill instructions
- Only relevant data is fetched per question, not the entire DB

## Current Problems
1. Every request sends ALL market data + KB articles (~10K-50K tokens)
2. N+1 queries in `ai-context-builder.ts` fetch everything on every call
3. No conversation history limit = unbounded token growth
4. Explicit context caching adds complexity for diminishing returns

## Architecture

```
User Question → Main Model (with catalog + tools declared)
                    ↓
              Function Call(s) → Tool Handler → DB Query → Raw Data
                    ↓
              if rawData > 2000 chars:
                    Cheap Model + Skill Instructions → Filtered Data
              else:
                    Raw Data directly
                    ↓
              Function Response → Main Model → Final Answer → SSE Stream
```

## Phases

| # | Phase | Status | Effort | File |
|---|-------|--------|--------|------|
| 1 | Catalog builder + data functions | pending | 1.5h | [phase-01](./phase-01-catalog-and-data-layer.md) |
| 2 | Tool definitions + handlers | pending | 1.5h | [phase-02](./phase-02-tool-definitions-handlers.md) |
| 3 | Skills (cheap model instructions) | pending | 1.5h | [phase-03](./phase-03-skills.md) |
| 4 | Gemini service rewrite (tool loop) | pending | 1.5h | [phase-04](./phase-04-gemini-service-rewrite.md) |
| 5 | Chat service + routes update | pending | 1h | [phase-05](./phase-05-chat-service-routes.md) |
| 6 | Frontend tool-call events | pending | 1h | [phase-06](./phase-06-frontend-tool-events.md) |

## Key Decisions
- No feature flag — greenfield replacement
- `gemini-2.5-flash-lite` for cheap model ($0.10/1M input)
- History limit: 30 messages
- DATA_THRESHOLD: 2000 chars for cheap model decision
- Drop explicit context caching (prompt now ~500 tokens)
- Reuse existing format helpers from `ai-context-format-helpers.ts`
- Use `@google/genai` SDK v1.45+ (already installed)

## Dependencies
- Phase 2 depends on Phase 1 (data functions)
- Phase 3 is independent (skill text files) — **can parallelize with 1+2**
- Phase 4 depends on Phases 1, 2, 3
- Phase 5 depends on Phase 4
- Phase 6 depends on Phase 5 (SSE event shape)

## Execution Order (Optimal)
```
  Phase 1 ──→ Phase 2 ──┐
                         ├──→ Phase 4 → Phase 5 → Phase 6
  Phase 3 (parallel) ───┘
```

## Complete File Map

### Files to CREATE (9 new files)
```
apps/api/src/modules/market-data/
  ai-data-fetchers.ts            # 6 data-fetch functions + resolveMarket helper (~180 lines)

apps/api/src/modules/chat/
  gemini-tool-definitions.ts     # 6 FunctionDeclaration + GEMINI_TOOLS export (~100 lines)
  gemini-tool-handlers.ts        # executeToolCall dispatch (~80 lines)
  gemini-cheap-model.ts          # needsProcessing + processWithSkill (~60 lines)
  skills/
    index.ts                     # SKILL_MAP registry + getSkillForTool (~40 lines)
    pricing-search-skill.ts      # instruction string (~30 lines)
    overview-search-skill.ts     # instruction string (~25 lines)
    attractions-search-skill.ts  # instruction string (~25 lines)
    itinerary-search-skill.ts    # instruction string (~25 lines)
    business-data-search-skill.ts # instruction string (~25 lines)
    kb-search-skill.ts           # instruction string (~25 lines)
```

### Files to MODIFY (6 files)
```
apps/api/src/modules/market-data/
  ai-context-builder.ts          # +buildCatalog(), extract shared DB helpers, clear Gemini cache ref

apps/api/src/modules/chat/
  gemini-service.ts              # FULL REWRITE — tool-call loop replaces context dump
  chat-service.ts                # buildCatalog() instead of buildKbContext(), 30-msg limit
  chat-routes.ts                 # tool-call SSE events, updated generator signature

apps/web/src/
  hooks/use-chat-stream.ts       # parse tool-call SSE, expose toolCalls state
  pages/chat-page.tsx            # tool-call indicator UI, remove hasCachedContext
```

### Files to KEEP UNCHANGED
```
apps/api/src/modules/market-data/
  ai-context-format-helpers.ts   # ALL format* functions reused as-is

packages/shared/src/
  types/chat-types.ts            # ChatMessage type unchanged
  schemas/chat-schemas.ts        # Zod schemas unchanged
```

### Files/code to DELETE (within modified files)
- `gemini-service.ts`: getOrCreateCache(), simpleHash(), cache state vars, invalidateGeminiCache()
- `chat-service.ts`: getKbArticles(), buildKbContext()
- `ai-context-builder.ts`: dynamic import of invalidateGeminiCache

## Cost Comparison (estimated per request)
| Metric | Before (full dump) | After (RAG pipeline) |
|--------|-------------------|---------------------|
| System prompt | ~10K-50K tokens | ~500 tokens |
| Input cost | $0.005-$0.025 | ~$0.001 |
| Cheap model | N/A | ~$0.0001 (if used) |
| Latency | 1 API call | 2-3 API calls (+200-500ms for tools) |
| DB queries | ALL tables every time | Only relevant tables per tool |
