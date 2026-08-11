import type { AIService, ChatMessage } from "@english-a1/ai";
import { prisma } from "@english-a1/db";
import type { ConversationMessage } from "@english-a1/db";

import { NotFoundError } from "../../errors.js";

export interface ConversationMessageDTO {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: Date;
}

export interface ConversationSummaryDTO {
  id: string;
  startedAt: Date;
  messageCount: number;
  preview: string;
}

const PREVIEW_LENGTH = 80;

function truncate(text: string, maxLength: number): string {
  return text.length > maxLength ? `${text.slice(0, maxLength).trimEnd()}…` : text;
}

export interface ConversationServiceConfig {
  aiService?: AIService;
  model: string;
  providerName: string;
}

const OPENER = "Hi! What do you usually do after work or school?";
const NO_PROVIDER_REPLY =
  "Conversation practice needs an OpenRouter API key configured — set OPENROUTER_API_KEY and restart the API.";
const PROVIDER_FAILURE_REPLY = "Sorry, I'm having trouble responding right now. Please try again.";

function toDTO(message: ConversationMessage): ConversationMessageDTO {
  return {
    id: message.id,
    role: message.role,
    content: message.content,
    createdAt: message.createdAt,
  };
}

export class ConversationService {
  constructor(private readonly config: ConversationServiceConfig) {}

  async start(
    userId: string,
  ): Promise<{ conversationId: string; messages: ConversationMessageDTO[] }> {
    const conversation = await prisma.conversation.create({ data: { userId } });
    const opener = await prisma.conversationMessage.create({
      data: { conversationId: conversation.id, role: "assistant", content: OPENER },
    });
    return { conversationId: conversation.id, messages: [toDTO(opener)] };
  }

  async list(userId: string): Promise<ConversationSummaryDTO[]> {
    const conversations = await prisma.conversation.findMany({
      where: { userId },
      orderBy: { startedAt: "desc" },
      include: {
        messages: { orderBy: { createdAt: "desc" }, take: 1 },
        _count: { select: { messages: true } },
      },
    });

    return conversations.map((conversation) => ({
      id: conversation.id,
      startedAt: conversation.startedAt,
      messageCount: conversation._count.messages,
      preview: truncate(conversation.messages[0]?.content ?? "", PREVIEW_LENGTH),
    }));
  }

  async getHistory(conversationId: string, userId: string): Promise<ConversationMessageDTO[]> {
    await this.assertOwnership(conversationId, userId);
    const messages = await prisma.conversationMessage.findMany({
      where: { conversationId },
      orderBy: { createdAt: "asc" },
    });
    return messages.map(toDTO);
  }

  /**
   * Persists the learner's message, streams the tutor's reply chunk by
   * chunk, then persists the full reply once streaming finishes (or falls
   * back to a canned message on failure — the conversation never just
   * dies mid-stream from the learner's point of view).
   */
  async *streamReply(
    conversationId: string,
    userId: string,
    userContent: string,
  ): AsyncGenerator<string> {
    await this.assertOwnership(conversationId, userId);
    await prisma.conversationMessage.create({
      data: { conversationId, role: "user", content: userContent },
    });

    if (!this.config.aiService) {
      yield NO_PROVIDER_REPLY;
      await prisma.conversationMessage.create({
        data: { conversationId, role: "assistant", content: NO_PROVIDER_REPLY },
      });
      return;
    }

    const history = await prisma.conversationMessage.findMany({
      where: { conversationId },
      orderBy: { createdAt: "asc" },
    });
    const chatMessages: ChatMessage[] = history.map((message) => ({
      role: message.role,
      content: message.content,
    }));

    const startedAt = Date.now();
    let fullText = "";
    let success = true;
    let errorMessage: string | undefined;

    try {
      for await (const delta of this.config.aiService.generateConversationResponse({
        messages: chatMessages,
        model: this.config.model,
      })) {
        fullText += delta;
        yield delta;
      }
    } catch (error) {
      success = false;
      errorMessage = error instanceof Error ? error.message : String(error);
    }

    await this.logLLMRequest({
      success,
      latencyMs: Date.now() - startedAt,
      ...(errorMessage !== undefined ? { errorMessage } : {}),
    });

    if (fullText.length === 0) {
      fullText = PROVIDER_FAILURE_REPLY;
      yield fullText;
    }

    await prisma.conversationMessage.create({
      data: { conversationId, role: "assistant", content: fullText },
    });
  }

  private async assertOwnership(conversationId: string, userId: string): Promise<void> {
    const conversation = await prisma.conversation.findUnique({ where: { id: conversationId } });
    if (!conversation || conversation.userId !== userId) {
      throw new NotFoundError(`Conversation ${conversationId} not found`);
    }
  }

  private async logLLMRequest(meta: {
    success: boolean;
    latencyMs: number;
    errorMessage?: string;
  }): Promise<void> {
    await prisma.lLMRequest.create({
      data: {
        provider: this.config.providerName,
        model: this.config.model,
        requestType: "conversation",
        latencyMs: meta.latencyMs,
        success: meta.success,
        errorMessage: meta.errorMessage ?? null,
      },
    });
  }
}
