# AI Completion Flow

All AI operations follow a consistent pattern through the AIService.

## Provider Architecture

```
AIService
    │
    ├── openaiProvider (GPT-4, GPT-4o-mini)
    │
    ├── anthropicProvider (Claude 3 Sonnet, Opus)
    │
    └── grokProvider (Grok-2)
```

## Sequence Diagram

```
 AIService                UserAISettings          Provider               PromptLog
     │                          │                     │                      │
     │ getEffectiveApiKey()     │                     │                      │
     ├─────────────────────────>│                     │                      │
     │                          │                     │                      │
     │ { provider, model,       │                     │                      │
     │   apiKey, temp, tokens } │                     │                      │
     │<─────────────────────────│                     │                      │
     │                          │                     │                      │
     │ Select provider          │                     │                      │
     ├──────┐                   │                     │                      │
     │      │ providers[name]   │                     │                      │
     │<─────┘                   │                     │                      │
     │                          │                     │                      │
     │ complete(request)        │                     │                      │
     ├───────────────────────────────────────────────>│                      │
     │                          │                     │                      │
     │ { content, usage }       │                     │                      │
     │<───────────────────────────────────────────────│                      │
     │                          │                     │                      │
     │ create(log)              │                     │                      │
     ├──────────────────────────────────────────────────────────────────────>│
     │                          │                     │                      │
     │ Return response          │                     │                      │
     │<─────────────────────────│                     │                      │
```

## Complete Flow

```typescript
async complete(userId: string, request: AICompletionRequest): Promise<AICompletionResponse> {
  // 1. Get user settings
  const { provider, model, apiKey, temperature, maxTokens } =
    await userAISettingsService.getEffectiveApiKey(userId);

  // 2. Select provider
  const providerInstance = providers[provider];

  // 3. Build final request
  const finalRequest = {
    ...request,
    temperature: request.temperature ?? temperature,
    max_tokens: request.max_tokens ?? maxTokens
  };

  try {
    // 4. Call AI provider
    const response = await providerInstance.complete(finalRequest, model, apiKey);

    // 5. Log success
    await aiPromptLogRepository.create({
      user_id: userId,
      model,
      provider,
      messages: finalRequest.messages,
      response_content: response.content,
      response_tokens: response.usage
    });

    return response;
  } catch (error) {
    // 6. Log error
    await aiPromptLogRepository.create({
      user_id: userId,
      model,
      provider,
      messages: finalRequest.messages,
      error: error.message
    });

    throw error;
  }
}
```

## AI Operations

| Operation       | Endpoint                    | System Prompt       |
| --------------- | --------------------------- | ------------------- |
| Generate Lesson | `POST /ai/user/:id/lesson`  | `lesson_generation` |
| Correct Answers | `POST /ai/user/:id/correct` | `correction`        |
| Chat            | `POST /ai/user/:id/chat`    | `conversation`      |
| Generate Report | `POST /ai/user/:id/report`  | `report_generation` |

## Request Structure

```typescript
interface AICompletionRequest {
  messages: AIMessage[];
  temperature?: number;
  max_tokens?: number;
  json_mode?: boolean;
}

interface AIMessage {
  role: "system" | "user" | "assistant";
  content: string;
}
```

## Response Structure

```typescript
interface AICompletionResponse {
  content: string;
  model: string;
  provider: AIProvider;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}
```

## Provider Interface

```typescript
interface IAIProvider {
  complete(
    request: AICompletionRequest,
    model: string,
    apiKey: string
  ): Promise<AICompletionResponse>;
}
```
