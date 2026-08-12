import type { EvaluationResult, ProfileAnalysisResult } from "@english-a1/shared";

import type { ChatMessage, LLMProvider } from "../domain/llm-provider.js";

import { parseEvaluationResponse } from "./parse-evaluation-response.js";
import { parsePracticeAnalysisResponse } from "./parse-practice-analysis-response.js";
import {
  buildEvaluationPrompt,
  buildPracticeAnalysisPrompt,
  CONVERSATION_SYSTEM_PROMPT,
  EVALUATION_SYSTEM_PROMPT,
  PRACTICE_ANALYSIS_SYSTEM_PROMPT,
  STRICT_JSON_SUFFIX,
} from "./prompts.js";
import type { EvaluationPromptInput, PracticeAnalysisPromptInput } from "./prompts.js";

export interface LLMCallMeta {
  provider: string;
  model: string;
  requestType: "evaluation" | "generation" | "explanation" | "conversation" | "analysis";
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

export interface AIAnalysisOutcome {
  analysis: ProfileAnalysisResult;
  meta: LLMCallMeta;
}

export class AIAnalysisFailedError extends Error {
  constructor(
    message: string,
    readonly meta: LLMCallMeta,
    override readonly cause?: unknown,
  ) {
    super(message);
    this.name = "AIAnalysisFailedError";
  }
}

export interface EvaluateAnswerInput extends EvaluationPromptInput {
  model: string;
  providerName: string;
}

export interface AnalyzePracticeInput extends PracticeAnalysisPromptInput {
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
    const prompt = buildEvaluationPrompt(input);

    const first = await this.tryGenerateJson({ system: EVALUATION_SYSTEM_PROMPT, prompt, model: input.model });
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

    const retry = await this.tryGenerateJson({
      system: EVALUATION_SYSTEM_PROMPT + STRICT_JSON_SUFFIX,
      prompt,
      model: input.model,
    });
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
   * Generates a bilingual, structured analysis of a learner's practice
   * history from a pre-aggregated data summary — same
   * try-once/retry-once-stricter/validate discipline as evaluateAnswer.
   */
  async analyzePractice(input: AnalyzePracticeInput): Promise<AIAnalysisOutcome> {
    const startedAt = Date.now();
    const baseMeta = {
      provider: input.providerName,
      model: input.model,
      requestType: "analysis" as const,
    };
    const prompt = buildPracticeAnalysisPrompt(input);

    const first = await this.tryGenerateJson({
      system: PRACTICE_ANALYSIS_SYSTEM_PROMPT,
      prompt,
      model: input.model,
    });
    if (first.ok) {
      const parsed = parsePracticeAnalysisResponse(first.text);
      if (parsed.success) {
        return {
          analysis: parsed.data,
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
      throw new AIAnalysisFailedError(first.errorMessage, {
        ...baseMeta,
        latencyMs: Date.now() - startedAt,
        success: false,
        errorMessage: first.errorMessage,
      });
    }

    const retry = await this.tryGenerateJson({
      system: PRACTICE_ANALYSIS_SYSTEM_PROMPT + STRICT_JSON_SUFFIX,
      prompt,
      model: input.model,
    });
    if (!retry.ok) {
      throw new AIAnalysisFailedError(retry.errorMessage, {
        ...baseMeta,
        latencyMs: Date.now() - startedAt,
        success: false,
        errorMessage: retry.errorMessage,
      });
    }

    const retryParsed = parsePracticeAnalysisResponse(retry.text);
    if (!retryParsed.success) {
      throw new AIAnalysisFailedError(
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
      analysis: retryParsed.data,
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

  private async tryGenerateJson(input: {
    system: string;
    prompt: string;
    model: string;
  }): Promise<
    | { ok: true; text: string; promptTokens?: number; completionTokens?: number }
    | { ok: false; errorMessage: string }
  > {
    try {
      const result = await this.provider.generate({
        system: input.system,
        prompt: input.prompt,
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
