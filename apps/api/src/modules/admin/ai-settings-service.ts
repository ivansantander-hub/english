import { prisma } from "@english-a1/db";

import { env } from "../../config/env.js";

const SETTINGS_ID = "singleton";

export type AICapability = "evaluation" | "conversation" | "analysis";

export interface AISettingsDTO {
  defaultModel: string;
  evaluationModel: string | null;
  conversationModel: string | null;
  analysisModel: string | null;
}

/**
 * Runtime-editable AI model configuration. Until an admin saves a setting
 * for the first time, reads fall back to the env vars (LLM_MODEL and the
 * per-capability overrides) — the exact same bootstrap defaults the app
 * always had, just now upgradeable without a redeploy.
 */
export class AISettingsService {
  async get(): Promise<AISettingsDTO> {
    const row = await prisma.aISettings.findUnique({ where: { id: SETTINGS_ID } });
    if (!row) {
      return {
        defaultModel: env.LLM_MODEL,
        evaluationModel: env.EVALUATION_MODEL ?? null,
        conversationModel: env.CONVERSATION_MODEL ?? null,
        analysisModel: env.ANALYSIS_MODEL ?? null,
      };
    }
    return {
      defaultModel: row.defaultModel,
      evaluationModel: row.evaluationModel,
      conversationModel: row.conversationModel,
      analysisModel: row.analysisModel,
    };
  }

  async update(input: AISettingsDTO): Promise<AISettingsDTO> {
    const row = await prisma.aISettings.upsert({
      where: { id: SETTINGS_ID },
      create: { id: SETTINGS_ID, ...input },
      update: input,
    });
    return {
      defaultModel: row.defaultModel,
      evaluationModel: row.evaluationModel,
      conversationModel: row.conversationModel,
      analysisModel: row.analysisModel,
    };
  }

  async modelFor(capability: AICapability): Promise<string> {
    const settings = await this.get();
    const overrides: Record<AICapability, string | null> = {
      evaluation: settings.evaluationModel,
      conversation: settings.conversationModel,
      analysis: settings.analysisModel,
    };
    return overrides[capability] ?? settings.defaultModel;
  }
}

export const aiSettingsService = new AISettingsService();
