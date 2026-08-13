import { prisma } from "@english-a1/db";
import type { LLMRequestType } from "@english-a1/db";

const RECENT_REQUESTS_LIMIT = 50;

export interface LLMUsageTotals {
  totalRequests: number;
  successfulRequests: number;
  totalCostUsd: number;
  totalPromptTokens: number;
  totalCompletionTokens: number;
}

export interface LLMUsageBreakdown {
  key: string;
  count: number;
  costUsd: number;
}

export interface LLMUsageRequestRow {
  id: string;
  createdAt: Date;
  userEmail: string | null;
  requestType: LLMRequestType;
  model: string;
  success: boolean;
  latencyMs: number;
  promptTokens: number | null;
  completionTokens: number | null;
  costUsd: number | null;
  errorMessage: string | null;
}

export interface LLMUsageSummary {
  totals: LLMUsageTotals;
  byType: LLMUsageBreakdown[];
  byModel: LLMUsageBreakdown[];
  recent: LLMUsageRequestRow[];
}

export class LLMUsageService {
  async getSummary(): Promise<LLMUsageSummary> {
    const [totalCount, successCount, sums, byType, byModel, recent] = await Promise.all([
      prisma.lLMRequest.count(),
      prisma.lLMRequest.count({ where: { success: true } }),
      prisma.lLMRequest.aggregate({
        _sum: { costUsd: true, promptTokens: true, completionTokens: true },
      }),
      prisma.lLMRequest.groupBy({
        by: ["requestType"],
        _count: true,
        _sum: { costUsd: true },
      }),
      prisma.lLMRequest.groupBy({
        by: ["model"],
        _count: true,
        _sum: { costUsd: true },
      }),
      prisma.lLMRequest.findMany({
        orderBy: { createdAt: "desc" },
        take: RECENT_REQUESTS_LIMIT,
        include: { user: { select: { email: true } } },
      }),
    ]);

    return {
      totals: {
        totalRequests: totalCount,
        successfulRequests: successCount,
        totalCostUsd: sums._sum.costUsd ?? 0,
        totalPromptTokens: sums._sum.promptTokens ?? 0,
        totalCompletionTokens: sums._sum.completionTokens ?? 0,
      },
      byType: byType
        .map((row) => ({ key: row.requestType, count: row._count, costUsd: row._sum.costUsd ?? 0 }))
        .sort((a, b) => b.costUsd - a.costUsd),
      byModel: byModel
        .map((row) => ({ key: row.model, count: row._count, costUsd: row._sum.costUsd ?? 0 }))
        .sort((a, b) => b.costUsd - a.costUsd),
      recent: recent.map((row) => ({
        id: row.id,
        createdAt: row.createdAt,
        userEmail: row.user?.email ?? null,
        requestType: row.requestType,
        model: row.model,
        success: row.success,
        latencyMs: row.latencyMs,
        promptTokens: row.promptTokens,
        completionTokens: row.completionTokens,
        costUsd: row.costUsd,
        errorMessage: row.errorMessage,
      })),
    };
  }
}

export const llmUsageService = new LLMUsageService();
