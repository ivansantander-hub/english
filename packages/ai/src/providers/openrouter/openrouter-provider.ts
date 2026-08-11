import { AIProviderError } from "../../domain/llm-provider.js";
import type {
  LLMChatStreamInput,
  LLMGenerateInput,
  LLMGenerateOutput,
  LLMProvider,
} from "../../domain/llm-provider.js";

export interface OpenRouterConfig {
  apiKey: string;
  baseUrl: string;
  /** Sent as HTTP-Referer per OpenRouter's attribution convention. */
  appUrl?: string;
  timeoutMs?: number;
}

interface OpenRouterChatResponse {
  choices?: Array<{ message?: { content?: string } }>;
  usage?: { prompt_tokens?: number; completion_tokens?: number };
}

interface OpenRouterStreamChunk {
  choices?: Array<{ delta?: { content?: string } }>;
}

/**
 * The only adapter that speaks to OpenRouter's HTTP API. Nothing outside
 * this file knows the request/response shape — everyone else depends on
 * the LLMProvider port.
 */
export class OpenRouterProvider implements LLMProvider {
  constructor(private readonly config: OpenRouterConfig) {}

  async generate(input: LLMGenerateInput): Promise<LLMGenerateOutput> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.config.timeoutMs ?? 30_000);

    try {
      const response = await fetch(`${this.config.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.config.apiKey}`,
          "X-Title": "English A1 Practice",
          ...(this.config.appUrl ? { "HTTP-Referer": this.config.appUrl } : {}),
        },
        body: JSON.stringify({
          model: input.model,
          temperature: input.temperature ?? 0.2,
          messages: [
            { role: "system", content: input.system },
            { role: "user", content: input.prompt },
          ],
          ...(input.responseFormat === "json" ? { response_format: { type: "json_object" } } : {}),
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const body = await response.text().catch(() => "");
        throw new AIProviderError(
          `OpenRouter request failed (${response.status}): ${body.slice(0, 500)}`,
        );
      }

      const data = (await response.json()) as OpenRouterChatResponse;
      const text = data.choices?.[0]?.message?.content;
      if (!text) throw new AIProviderError("OpenRouter response had no message content");

      return {
        text,
        ...(data.usage
          ? {
              usage: {
                ...(data.usage.prompt_tokens !== undefined
                  ? { promptTokens: data.usage.prompt_tokens }
                  : {}),
                ...(data.usage.completion_tokens !== undefined
                  ? { completionTokens: data.usage.completion_tokens }
                  : {}),
              },
            }
          : {}),
      };
    } catch (error) {
      if (error instanceof AIProviderError) throw error;
      if (error instanceof Error && error.name === "AbortError") {
        throw new AIProviderError("OpenRouter request timed out", error);
      }
      throw new AIProviderError("OpenRouter request failed", error);
    } finally {
      clearTimeout(timeout);
    }
  }

  async *generateStream(input: LLMChatStreamInput): AsyncIterable<string> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.config.timeoutMs ?? 30_000);

    try {
      const response = await fetch(`${this.config.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.config.apiKey}`,
          "X-Title": "English A1 Practice",
          ...(this.config.appUrl ? { "HTTP-Referer": this.config.appUrl } : {}),
        },
        body: JSON.stringify({
          model: input.model,
          temperature: input.temperature ?? 0.7,
          stream: true,
          messages: [
            { role: "system", content: input.system },
            ...input.messages.map((message) => ({ role: message.role, content: message.content })),
          ],
        }),
        signal: controller.signal,
      });

      if (!response.ok || !response.body) {
        const body = await response.text().catch(() => "");
        throw new AIProviderError(
          `OpenRouter streaming request failed (${response.status}): ${body.slice(0, 500)}`,
        );
      }

      yield* parseSseTextStream(response.body);
    } catch (error) {
      if (error instanceof AIProviderError) throw error;
      if (error instanceof Error && error.name === "AbortError") {
        throw new AIProviderError("OpenRouter streaming request timed out", error);
      }
      throw new AIProviderError("OpenRouter streaming request failed", error);
    } finally {
      clearTimeout(timeout);
    }
  }
}

/**
 * OpenAI-compatible SSE format: lines of `data: {...}`, terminated by
 * `data: [DONE]`. Extracts each chunk's text delta.
 */
async function* parseSseTextStream(body: ReadableStream<Uint8Array>): AsyncIterable<string> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data:")) continue;
        const payload = trimmed.slice("data:".length).trim();
        if (payload === "[DONE]") return;

        try {
          const chunk = JSON.parse(payload) as OpenRouterStreamChunk;
          const delta = chunk.choices?.[0]?.delta?.content;
          if (delta) yield delta;
        } catch {
          // Ignore malformed keep-alive/comment lines.
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}
