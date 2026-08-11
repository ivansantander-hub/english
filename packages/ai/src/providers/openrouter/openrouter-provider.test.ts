import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AIProviderError } from "../../domain/llm-provider.js";

import { OpenRouterProvider } from "./openrouter-provider.js";

function sseStream(events: string[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  return new ReadableStream({
    start(controller) {
      for (const event of events) {
        controller.enqueue(encoder.encode(`data: ${event}\n\n`));
      }
      controller.close();
    },
  });
}

async function collect(iterable: AsyncIterable<string>): Promise<string[]> {
  const chunks: string[] = [];
  for await (const chunk of iterable) chunks.push(chunk);
  return chunks;
}

describe("OpenRouterProvider", () => {
  const provider = new OpenRouterProvider({ apiKey: "test-key", baseUrl: "https://example.test" });

  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns the message content and usage from a successful non-streaming call", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(
        JSON.stringify({
          choices: [{ message: { content: "He works in an office." } }],
          usage: { prompt_tokens: 10, completion_tokens: 4 },
        }),
        { status: 200 },
      ),
    );

    const result = await provider.generate({ system: "s", prompt: "p", model: "m" });

    expect(result.text).toBe("He works in an office.");
    expect(result.usage).toEqual({ promptTokens: 10, completionTokens: 4 });
  });

  it("throws AIProviderError on a non-2xx response", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ error: { message: "bad model" } }), { status: 400 }),
    );

    await expect(provider.generate({ system: "s", prompt: "p", model: "m" })).rejects.toThrow(
      AIProviderError,
    );
  });

  it("yields text deltas parsed from an SSE stream", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(
        sseStream([
          JSON.stringify({ choices: [{ delta: { content: "Hello" } }] }),
          JSON.stringify({ choices: [{ delta: { content: " there" } }] }),
          "[DONE]",
        ]),
        { status: 200 },
      ),
    );

    const chunks = await collect(
      provider.generateStream({
        system: "s",
        messages: [{ role: "user", content: "hi" }],
        model: "m",
      }),
    );

    expect(chunks).toEqual(["Hello", " there"]);
  });

  it("ignores malformed SSE lines instead of throwing", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(
        sseStream(["not json", JSON.stringify({ choices: [{ delta: { content: "ok" } }] })]),
        {
          status: 200,
        },
      ),
    );

    const chunks = await collect(
      provider.generateStream({
        system: "s",
        messages: [{ role: "user", content: "hi" }],
        model: "m",
      }),
    );

    expect(chunks).toEqual(["ok"]);
  });

  it("throws AIProviderError when the streaming request itself fails", async () => {
    vi.mocked(fetch).mockResolvedValue(new Response("server error", { status: 500 }));

    await expect(
      collect(
        provider.generateStream({
          system: "s",
          messages: [{ role: "user", content: "hi" }],
          model: "m",
        }),
      ),
    ).rejects.toThrow(AIProviderError);
  });
});
