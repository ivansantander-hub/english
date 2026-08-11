import type { EvaluationResult } from "@english-a1/shared";

import type { ChatMessage, LLMProvider } from "../domain/llm-provider.js";

import { parseEvaluationResponse } from "./parse-evaluation-response.js";
import {
  buildEvaluationPrompt,
  CONVERSATION_SYSTEM_PROMPT,
  EVALUATION_SYSTEM_PROMPT,
  STRICT_JSON_SUFFIX,
} from "./prompts.js";
import type { EvaluationPromptInput } from "./prompts.js";

export interface LLMCallMeta {
  provider: string;
  model: string;
  requestType: "evaluation" | "generation" | "explanation" | "conversation";
  latencyMs: number;
  success: boolean;
  errorMessage?: string;
  promptTokens?: number;
  completionTokens?: number;
}

export interface AIEvaluationOutcome {
  evaluation: EvaluationResult;
  meta: LLMCallMeta;
}

export class AIEvaluationFailedError extends Error {
  constructor(
    message: string,
    readonly meta: LLMCallMeta,
    override readonly cause?: unknown,
  ) {
    super(message);
    this.name = "AIEvaluationFailedError";
  }
}

export interface EvaluateAnswerInput extends EvaluationPromptInput {
  model: string;
  providerName: string;
}

/**
 * Application-facing AI capability surface. The learning/evaluation domain
 * calls these methods and never touches LLMProvider or OpenRouter directly.
 */
export class AIService {
  constructor(private readonly provider: LLMProvider) {}

  async evaluateAnswer(input: EvaluateAnswerInput): Promise<AIEvaluationOutcome> {
    const startedAt = Date.now();
    const baseMeta = {
      provider: input.providerName,
      model: input.model,
      requestType: "evaluation" as const,
    };

    const first = await this.tryGenerate(input, EVALUATION_SYSTEM_PROMPT);
    if (first.ok) {
      const parsed = parseEvaluationResponse(first.text);
      if (parsed.success) {
        return {
          evaluation: parsed.data,
          meta: {
            ...baseMeta,
            latencyMs: Date.now() - startedAt,
            success: true,
            ...(first.promptTokens !== undefined ? { promptTokens: first.promptTokens } : {}),
            ...(first.completionTokens !== undefined
              ? { completionTokens: first.completionTokens }
              : {}),
          },
        };
      }
      // Fall through to one retry with a stricter instruction.
    } else {
      throw new AIEvaluationFailedError(first.errorMessage, {
        ...baseMeta,
        latencyMs: Date.now() - startedAt,
        success: false,
        errorMessage: first.errorMessage,
      });
    }

    const retry = await this.tryGenerate(input, EVALUATION_SYSTEM_PROMPT + STRICT_JSON_SUFFIX);
    if (!retry.ok) {
      throw new AIEvaluationFailedError(retry.errorMessage, {
        ...baseMeta,
        latencyMs: Date.now() - startedAt,
        success: false,
        errorMessage: retry.errorMessage,
      });
    }

    const retryParsed = parseEvaluationResponse(retry.text);
    if (!retryParsed.success) {
      throw new AIEvaluationFailedError(
        `AI response failed schema validation twice: ${retryParsed.reason}`,
        {
          ...baseMeta,
          latencyMs: Date.now() - startedAt,
          success: false,
          errorMessage: retryParsed.reason,
        },
      );
    }

    return {
      evaluation: retryParsed.data,
      meta: {
        ...baseMeta,
        latencyMs: Date.now() - startedAt,
        success: true,
        ...(retry.promptTokens !== undefined ? { promptTokens: retry.promptTokens } : {}),
        ...(retry.completionTokens !== undefined
          ? { completionTokens: retry.completionTokens }
          : {}),
      },
    };
  }

  /**
   * Streams a conversational tutor reply. Errors from the underlying
   * provider propagate to the caller (mid-stream failures can't retry the
   * way a single JSON response can) — the conversation module in apps/api
   * is responsible for timing/logging the call and handling partial output.
   */
  generateConversationResponse(input: {
    messages: ChatMessage[];
    model: string;
  }): AsyncIterable<string> {
    return this.provider.generateStream({
      system: CONVERSATION_SYSTEM_PROMPT,
      messages: input.messages,
      model: input.model,
    });
  }

  private async tryGenerate(
    input: EvaluateAnswerInput,
    system: string,
  ): Promise<
    | { ok: true; text: string; promptTokens?: number; completionTokens?: number }
    | { ok: false; errorMessage: string }
  > {
    try {
      const result = await this.provider.generate({
        system,
        prompt: buildEvaluationPrompt(input),
        model: input.model,
        responseFormat: "json",
        temperature: 0,
      });
      return {
        ok: true,
        text: result.text,
        ...(result.usage?.promptTokens !== undefined
          ? { promptTokens: result.usage.promptTokens }
          : {}),
        ...(result.usage?.completionTokens !== undefined
          ? { completionTokens: result.usage.completionTokens }
          : {}),
      };
    } catch (error) {
      return { ok: false, errorMessage: error instanceof Error ? error.message : String(error) };
    }
  }
}
