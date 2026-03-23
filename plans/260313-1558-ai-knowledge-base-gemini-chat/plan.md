# AI Knowledge Base & Gemini Chat Integration

## Overview
Build knowledge base from customer Google Sheets data and integrate Gemini AI for real chat responses. Salespeople need an AI agent that can answer travel questions, calculate prices, suggest itineraries, and compare hotels.

## Data Sources (Google Sheets)
1. **Pricing Rules** - Hotel room prices (weekday/weekend/Saturday), surcharges, transport pricing, combo calculation formula
2. **Competitors** - 4 competitor groups with strengths/weaknesses
3. **Itineraries** - Cat Ba 2D1N, 3D2N, Cat Ba + Ha Long 3D2N (hour-by-hour)
4. **Customer Journey** - 6 stages from discovery to post-trip
5. **Hotel Evaluation Criteria** - Location, facilities, operations, service benchmarks

## Phases

### Phase 1: Backend - Knowledge Base Data Import & Sync ⬜
**Assignee**: Backend Dev
**Status**: Not started

- Add `GEMINI_API_KEY` to `.env`
- Install `@google/genai` in apps/api
- Create `google-sheets-sync-service.ts` - fetch CSV from Google Sheets public export URLs
- Enhance `knowledge-base-schema.ts` - add `sourceUrl` (varchar), `sourceType` (varchar) fields for tracking data source
- Create KB seed/import function to parse and store all 6 sheets data as categorized KB articles
- Build sync API endpoint `POST /api/v1/knowledge-base/sync` (admin only) to re-fetch from Google Sheets

### Phase 2: Backend - Gemini AI Chat Integration ⬜
**Assignee**: Backend Dev
**Status**: Not started

- Create `gemini-service.ts` using `@google/genai` with model `gemini-3-flash-preview`
- Build system prompt that includes:
  - All KB articles as context (pricing rules, hotel data, itineraries, evaluation criteria)
  - Combo pricing formula: `(Sum of all services * profit margin %) / number of people`
  - Day-of-week pricing logic (Mon-Thu, Fri+Sun, Saturday)
  - Surcharge rules (extra adults: 200k, children under 10: 100k, under 5: free)
- Update `chat-service.ts` `sendMessage()` to call Gemini instead of returning placeholder
- Maintain conversation history per session for multi-turn chat

### Phase 3: Testing - Real Salesperson Test Cases ⬜
**Assignee**: Backend Dev (automated) + QA review
**Status**: Not started

Test cases from customer requirements:
1. Compare pros/cons between 2 homestays
2. Rooms with outdoor bath + privacy in Sa Pa
3. 4-day honeymoon in Phu Quoc (avoid crowds, local seafood, detailed itinerary)
4. Ha Giang buckwheat flowers season + photo spots for 29-seat vehicles
5. Price: 3 adults + 2 kids (5, 11) at homestay X, 3D2N, Friday start
6. Surcharge from Ha Long to Sa Pa
7. Sa Pa combos under 990k/person
8. Multi-hotel combo pricing (hotel X night 1, hotel Y night 2, 3D2N for 2 people)

## Architecture

```
User → Chat UI → POST /api/v1/chat/sessions/:id/messages
  → chat-service.sendMessage()
    → Fetch KB articles by relevance
    → Build Gemini prompt with KB context + conversation history
    → Call Gemini API (gemini-3-flash-preview)
    → Store user + AI messages in DB
    → Return response

Admin → POST /api/v1/knowledge-base/sync
  → google-sheets-sync-service
    → Fetch 6 Google Sheets CSVs
    → Parse & upsert KB articles
```

## Key Decisions
- Store Google Sheets data as KB articles (not separate tables) - reuses existing schema
- Add `sourceUrl` + `sourceType` to KB for tracking and re-syncing
- System prompt includes ALL KB data (data volume is small enough)
- Use `gemini-3-flash-preview` model per customer requirement
- Conversation history maintained via existing chat_messages table

## Dependencies
- Google Sheets must remain publicly accessible for CSV export
- Gemini API key: `AIzaSyDLc8RoMIUO__nRi6KbXR-Q0WzCOGsKRrM`
