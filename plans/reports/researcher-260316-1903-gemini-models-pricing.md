# Gemini API Models & Pricing Research (March 2026)

**Date:** 2026-03-16
**Focus:** Latest Gemini models, pricing, function calling, and JavaScript SDK capabilities
**Status:** Complete research report

---

## Executive Summary

Gemini now offers 5+ production models with vastly different price/performance tradeoffs. **Gemini 3.1 Flash-Lite** ($0.25/$1.50 per 1M tokens) is the cheapest option for text. **Gemini 2.5 Flash-Lite** ($0.10/$0.40) remains available as ultra-budget tier. Both support function calling. The `@google/genai` SDK v1.45+ allows seamless multi-model switching in the same app. Streaming + function calling is fully supported across all models that have function calling enabled.

---

## 1. Cheapest Gemini Models for Text Processing

### Current Tier Rankings (Cost)

| Model | Input Cost | Output Cost | Free Tier | Notes |
|-------|-----------|------------|-----------|-------|
| **Gemini 2.5 Flash-Lite** | $0.10/1M | $0.40/1M | ✓ Full | Ultra-budget, stable production |
| **Gemini 3.1 Flash-Lite** | $0.25/1M | $1.50/1M | ✓ Full | Newest, 2.5x faster than 2.5 Flash |
| **Gemini 3 Flash** | $0.50/1M | $3.00/1M | ✓ Full | Frontier performance at lower cost |
| **Gemini 2.5 Flash** | $0.30/1M | $2.50/1M | ✓ Full | Best price-performance for reasoning |
| **Gemini 2.5 Pro** | $1.25/1M | $10.00/1M | ✗ | Advanced reasoning, coding |
| **Gemini 3.1 Pro** | $2.00/1M | $12.00/1M | ✗ | Latest advanced model |

**Key finding:** Gemini 2.5 Flash-Lite is still the absolute cheapest at $0.10 input. Gemini 3.1 Flash-Lite is 2.5x more expensive but offers faster inference. Both are free tier eligible.

### Deprecation Alert
- **Gemini 2.0 Flash & Flash-Lite retire June 1, 2026** — plan migration to 2.5 or 3.x series
- All Gemini 3 series are preview/production as of March 2026

---

## 2. Pricing Comparison (Per 1M Tokens)

### Batch Pricing Discount
All models offer **50% reduction** on standard rates when using Batch API. Example:
- Gemini 2.5 Flash-Lite: $0.05 input / $0.20 output (batch)
- Gemini 3.1 Flash-Lite: $0.125 input / $0.75 output (batch)

### Context Length Pricing Tiers
**Gemini 3.1 Pro & Gemini 2.5 Pro** have tiered pricing:
- ≤200K tokens: Standard rate
- >200K tokens: 2x the standard rate (incentivizes keeping context compact)

**All other models:** Flat pricing regardless of context length

### Cost for Typical Workload Example
Processing 1M input tokens + 100K output tokens:

| Model | Cost | Savings vs Pro |
|-------|------|----------------|
| 2.5 Flash-Lite | $0.14 | 92% cheaper than Pro |
| 3.1 Flash-Lite | $0.40 | 68% cheaper than Pro |
| 3 Flash | $0.80 | 36% cheaper than 3.1 Pro |
| 2.5 Flash | $0.55 | 55% cheaper than Pro |
| 2.5 Pro | $1.25 | baseline |

---

## 3. Multi-Model Support in @google/genai SDK

### Yes - Fully Supported

The `@google/genai` SDK v1.45+ (latest) allows calling different models in the same app without restrictions:

```javascript
import { GoogleGenerativeAI } from "@google/genai";

const client = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

// Use cheap model for data processing
const fastModel = client.getGenerativeModel({
  model: "gemini-2.5-flash-lite"
});

// Use advanced model for response generation
const advancedModel = client.getGenerativeModel({
  model: "gemini-2.5-pro"
});

// Both work seamlessly in same application
const cheapResponse = await fastModel.generateContent("Process this...");
const advancedResponse = await advancedModel.generateContent("Generate insights...");
```

### Key Points
- Unified interface works with both Gemini Developer API and Vertex AI
- Model selection happens at request time (no special config needed)
- Can switch models within same conversation/session
- Zero code changes needed to support new models when released

---

## 4. Function Calling with Streaming & Multi-Turn Support

### Multi-Turn Tool Calling
**Fully supported.** Workflow:

1. Define function declarations with names, descriptions, and parameter schemas
2. Send prompt + tool declarations to model
3. Model returns `FunctionCall` object with name + parameters
4. App executes actual function (model doesn't execute)
5. Send results back as `FunctionResponse` in next turn
6. Model generates final response incorporating data

### Streaming Support
**YES - Streaming + Function Calling both work together:**

- Standard streaming: `generateContentStream()` yields chunks as they're generated
- Streaming function call arguments: Gemini 3 & later models can stream function arguments as they're generated (set `streamFunctionCallArguments: true`)
- Use `for await` loop to consume stream chunks in JavaScript

### Advanced Tool Patterns
- **Parallel function calling:** Execute multiple independent functions in single turn
- **Compositional function calling:** Chain dependent functions (e.g., call `get_location()` then `get_weather(location)`)
- **Thought signatures:** Gemini 3/2.5 models use internal reasoning to maintain context across multi-turn conversations

### Known Issue with Streaming Function Calls
There's a bug in Gemini 3.1 Flash-Lite streaming mode: final chunk has `finish_reason: "stop"` instead of `tool_calls` flag. Workaround: Check last message role for tool calls instead of relying on finish_reason.

---

## 5. Using Different Models for Different Steps

### Pattern: Yes, Fully Feasible

Typical pipeline:

```javascript
// Step 1: Data validation/extraction (cheap + fast)
const dataModel = client.getGenerativeModel({
  model: "gemini-2.5-flash-lite"
});

// Step 2: Data processing (balanced)
const processModel = client.getGenerativeModel({
  model: "gemini-2.5-flash"
});

// Step 3: Response generation (expensive but best)
const generateModel = client.getGenerativeModel({
  model: "gemini-2.5-pro"
});

// Execute pipeline
const extracted = await dataModel.generateContent(userInput); // $0.10 input
const processed = await processModel.generateContent(extracted); // $0.30 input
const final = await generateModel.generateContent(processed); // $1.25 input
```

**Cost savings:** Uses cheaper models for deterministic tasks, reserves expensive model only for generation.

### Recommended Patterns
- **Data extraction:** Flash-Lite or Flash
- **Code execution/validation:** Flash (has code interpreter)
- **Complex reasoning/coding:** Pro (better accuracy)
- **Real-time function calling:** Flash or Flash-Lite (faster time-to-first-token)

---

## 6. Minimum Model for Function Calling

### Which Models Support Function Calling?

| Model | Function Calling | Streaming Calls |
|-------|-----------------|-----------------|
| **Gemini 3.1 Pro** | ✓ | ✓ |
| **Gemini 3 Flash** | ✓ | ✓ |
| **Gemini 3.1 Flash-Lite** | ✓ | ✓* |
| **Gemini 2.5 Pro** | ✓ | ✓ |
| **Gemini 2.5 Flash** | ✓ | ✓ |
| **Gemini 2.5 Flash-Lite** | ✓ | ✓ |
| **Gemini 2.0 Flash** | ✓ | ✓ |
| **Gemini 2.0 Flash-Lite** | ✗ | ✗ |

*Streaming function calls work but have finish_reason bug

### Answer: Gemini 2.5 Flash-Lite is Minimum

**Gemini 2.5 Flash-Lite** ($0.10/$0.40 per 1M) is the cheapest model with full function calling support:

- Supports all function calling modes: `auto`, `required`, `none`
- Supports parallel function calling (multiple tools in one call)
- Supports compositional function calling (chaining dependent tools)
- Max 128 functions per request
- Full streaming support
- Available on free tier

**Not suitable for:** Complex multi-step reasoning. If you need advanced logic, use Flash ($0.30/$2.50) or Pro tier.

### Why Flash-Lite Works for Tools
- Tool use is typically deterministic (just need to identify which tool + extract args)
- Doesn't require deep reasoning (just pattern matching against schemas)
- Fast execution time reduces latency for tool-heavy workflows
- Cost: ~$0.0001 per 100 function calls at average token usage

---

## 7. @google/genai SDK v1.45+ Key APIs

### Core APIs for Multi-Model + Function Calling

```javascript
import { GoogleGenerativeAI, FunctionDeclarationMode } from "@google/genai";

const client = new GoogleGenerativeAI(apiKey);

// Get specific model
const model = client.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

// Streaming generation
const stream = await model.generateContentStream(prompt);
for await (const chunk of stream) {
  console.log(chunk.text);
}

// Function calling setup
const toolConfig = {
  functionCallingConfig: {
    mode: FunctionDeclarationMode.ANY // or REQUIRED, NONE
  }
};

const tools = [
  {
    name: "get_weather",
    description: "Get weather for a location",
    parameters: {
      type: "object",
      properties: {
        location: { type: "string" },
        unit: { enum: ["celsius", "fahrenheit"] }
      },
      required: ["location"]
    }
  }
];

// Generate with tools
const response = await model.generateContent({
  contents: [{ role: "user", text: "What's the weather?" }],
  tools: [{ functionDeclarations: tools }],
  toolConfig
});

// Handle function calls
if (response.functionCalls) {
  for (const call of response.functionCalls) {
    const result = await executeFunction(call.name, call.args);
    // Send result back in next turn
  }
}
```

### Key Features
- `generateContentStream()` for real-time responses
- `generateContent()` for standard requests
- Automatic tool declaration validation
- Model Context Protocol (MCP) support via experimental `mcpToTool()`
- Works identically across Gemini Developer API and Vertex AI

---

## Recommendations for Your Use Case

### For AI Knowledge Base Chat App

1. **Data Processing (KB indexing):** Use Gemini 2.5 Flash-Lite
   - Lowest cost, deterministic
   - Can parallelize across many documents
   - Estimate: $5-10/month for typical KB

2. **User Message Processing:** Use Gemini 2.5 Flash
   - Good balance of speed and reasoning
   - Supports function calling for KB retrieval
   - Estimate: $20-50/month depending on traffic

3. **Complex Responses:** Consider Gemini 3.1 Flash-Lite
   - 2.5x faster than Flash
   - Better reasoning than old Flash-Lite
   - Only $0.15 more expensive than 2.5 Flash-Lite per 1M tokens

4. **Function Calling for KB Retrieval:** Any of above models work
   - Use streaming to show results as they arrive
   - All have identical function calling APIs

---

## Unresolved Questions

1. **Exact Gemini 3.1 Pro release date?** (Listed as preview in docs, but shown as GA in some sources)
2. **Nano Banana 2 availability?** (Mentioned in searches but not in official pricing page—unclear if released or coming)
3. **Streaming function argument feature availability?** (Docs say Gemini 3+, but unclear if all 3.x variants or just Pro)
4. **Custom models on Gemini API?** (Documentation doesn't mention—may only be on Vertex AI)

---

## Sources
- [Gemini API Pricing](https://ai.google.dev/gemini-api/docs/pricing)
- [Gemini Models Documentation](https://ai.google.dev/gemini-api/docs/models)
- [Function Calling Guide](https://ai.google.dev/gemini-api/docs/function-calling)
- [JS GenAI SDK Repository](https://github.com/googleapis/js-genai)
- [Gemini 3.1 Flash-Lite Blog Post](https://blog.google/innovation-and-ai/models-and-research/gemini-models/gemini-3-1-flash-lite/)
- [LLM API Pricing Comparison 2026](https://www.tldl.io/resources/llm-api-pricing-2026)
- [Gemini Function Calling Guides](https://ai.google.dev/gemini-api/docs/function-calling)
