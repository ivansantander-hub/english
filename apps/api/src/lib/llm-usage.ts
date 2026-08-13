import { computeCostUsd, fetchModelCatalog } from "@english-a1/ai";
import type { LLMCallMeta } from "@english-a1/ai";
import { prisma } from "@english-a1/db";

import { env } from "../config/env.js";

/**
 * Single place every AI-backed feature logs its call — evaluation,
 * conversation, and practice analysis all use this instead of their own
 * copy. Computes cost from OpenRouter's current pricing at log time
 * (best-effort: a failed/slow pricing lookup never blocks or fails the
 * audit write, it just leaves costUsd null).
 */
export async function logLLMRequest(userId: string | null, meta: LLMCallMeta): Promise<void> {
  let costUsd: number | undefined;
  try {
    const catalog = await fetchModelCatalog(env.OPENROUTER_BASE_URL);
    const modelInfo = catalog.find((model) => model.id === meta.model);
    costUsd = computeCostUsd(meta.promptTokens, meta.completionTokens, modelInfo);
  } catch {
    // Pricing lookup is best-effort — the audit row still gets written.
  }

  await prisma.lLMRequest.create({
    data: {
      userId,
      provider: meta.provider,
      model: meta.model,
      requestType: meta.requestType,
      latencyMs: meta.latencyMs,
      success: meta.success,
      errorMessage: meta.errorMessage ?? null,
      promptTokens: meta.promptTokens ?? null,
      completionTokens: meta.completionTokens ?? null,
      costUsd: costUsd ?? null,
    },
  });
}
