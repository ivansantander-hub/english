import { describe, expect, it } from "vitest";

import type {
  LLMChatStreamInput,
  LLMGenerateInput,
  LLMGenerateOutput,
  LLMProvider,
} from "../domain/llm-provider.js";
import { AIProviderError } from "../domain/llm-provider.js";

import { AIEvaluationFailedError, AIService } from "./ai-service.js";

const VALID_RESPONSE: LLMGenerateOutput = {
  text: JSON.stringify({
    overallScore: 1,
    sentences: [{ sentenceIndex: 0, text: "He works.", correct: true, score: 1, errors: [] }],
  }),
  usage: { promptTokens: 42, completionTokens: 10 },
};

class ScriptedProvider implements LLMProvider {
  private callIndex = 0;
  constructor(private readonly responses: Array<LLMGenerateOutput | Error>) {}

  generate(_input: LLMGenerateInput): Promise<LLMGenerateOutput> {
    const next = this.responses[this.callIndex];
    this.callIndex += 1;
    if (next === undefined) throw new Error("ScriptedProvider ran out of responses");
    if (next instanceof Error) return Promise.reject(next);
    return Promise.resolve(next);
  }

  // eslint-disable-next-line require-yield -- unused in these tests, satisfies the interface
  async *generateStream(_input: LLMChatStreamInput): AsyncIterable<string> {
    await Promise.resolve();
    throw new Error("ScriptedProvider.generateStream not used in these tests");
  }
}

const baseInput = {
  sourceText: "Él trabaja en una oficina.",
  referenceAnswer: "He works in an office.",
  rawAnswer: "He works in an office.",
  model: "test-model",
  providerName: "test-provider",
};

describe("AIService.evaluateAnswer", () => {
  it("returns the parsed evaluation and success metadata on a valid response", async () => {
    const service = new AIService(new ScriptedProvider([VALID_RESPONSE]));
    const outcome = await service.evaluateAnswer(baseInput);

    expect(outcome.evaluation.overallScore).toBe(1);
    expect(outcome.meta.success).toBe(true);
    expect(outcome.meta.promptTokens).toBe(42);
    expect(outcome.meta.completionTokens).toBe(10);
  });

  it("retries once and succeeds when the first response is malformed", async () => {
    const service = new AIService(new ScriptedProvider([{ text: "not json" }, VALID_RESPONSE]));
    const outcome = await service.evaluateAnswer(baseInput);

    expect(outcome.evaluation.overallScore).toBe(1);
    expect(outcome.meta.success).toBe(true);
  });

  it("throws AIEvaluationFailedError when both attempts return malformed JSON", async () => {
    const service = new AIService(
      new ScriptedProvider([{ text: "not json" }, { text: "still not json" }]),
    );

    await expect(service.evaluateAnswer(baseInput)).rejects.toThrow(AIEvaluationFailedError);
  });

  it("throws AIEvaluationFailedError immediately when the provider call fails", async () => {
    const service = new AIService(new ScriptedProvider([new AIProviderError("network down")]));

    await expect(service.evaluateAnswer(baseInput)).rejects.toThrow(AIEvaluationFailedError);
  });

  it("surfaces provider timeouts as a failed outcome with metadata for logging", async () => {
    const service = new AIService(new ScriptedProvider([new AIProviderError("request timed out")]));

    try {
      await service.evaluateAnswer(baseInput);
      expect.fail("expected evaluateAnswer to throw");
    } catch (error) {
      expect(error).toBeInstanceOf(AIEvaluationFailedError);
      const failure = error as AIEvaluationFailedError;
      expect(failure.meta.success).toBe(false);
      expect(failure.meta.errorMessage).toContain("timed out");
    }
  });

  it("fails schema validation when the response is valid JSON but the wrong shape", async () => {
    const service = new AIService(
      new ScriptedProvider([
        { text: JSON.stringify({ unexpected: true }) },
        { text: JSON.stringify({ unexpected: true }) },
      ]),
    );

    await expect(service.evaluateAnswer(baseInput)).rejects.toThrow(AIEvaluationFailedError);
  });
});

class StreamingProvider implements LLMProvider {
  constructor(private readonly chunks: string[]) {}

  generate(_input: LLMGenerateInput): Promise<LLMGenerateOutput> {
    throw new Error("StreamingProvider.generate not used in these tests");
  }

  async *generateStream(_input: LLMChatStreamInput): AsyncIterable<string> {
    await Promise.resolve();
    for (const chunk of this.chunks) yield chunk;
  }
}

describe("AIService.generateConversationResponse", () => {
  it("forwards deltas from the provider unchanged", async () => {
    const service = new AIService(new StreamingProvider(["Hi", " there", "!"]));

    const chunks: string[] = [];
    for await (const delta of service.generateConversationResponse({
      messages: [{ role: "user", content: "hello" }],
      model: "test-model",
    })) {
      chunks.push(delta);
    }

    expect(chunks).toEqual(["Hi", " there", "!"]);
  });
});
