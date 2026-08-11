import * as trpcExpress from "@trpc/server/adapters/express";
import cors from "cors";
import express from "express";
import type { Request, Response } from "express";

import { env } from "./config/env.js";
import { AuthService } from "./modules/auth/auth-service.js";
import { conversationService } from "./modules/conversation/router.js";
import { createContext, extractBearerToken } from "./trpc/context.js";
import { appRouter } from "./trpc/router.js";

const authService = new AuthService();

async function streamConversationReply(req: Request, res: Response): Promise<void> {
  const token = extractBearerToken(req.headers.authorization);
  const user = token ? await authService.resolveSession(token) : null;
  if (!user) {
    res.status(401).json({ error: "Log in to continue." });
    return;
  }

  const conversationId = req.params.id;
  const content: unknown = (req.body as { content?: unknown } | undefined)?.content;
  if (
    typeof conversationId !== "string" ||
    typeof content !== "string" ||
    content.trim().length === 0
  ) {
    res.status(400).json({ error: "content is required" });
    return;
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  try {
    for await (const delta of conversationService.streamReply(conversationId, user.id, content)) {
      res.write(`data: ${JSON.stringify({ delta })}\n\n`);
    }
    res.write("event: done\ndata: {}\n\n");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    res.write(`event: error\ndata: ${JSON.stringify({ message })}\n\n`);
  } finally {
    res.end();
  }
}

function main(): void {
  const app = express();
  app.use(cors({ origin: env.APP_URL }));
  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.use("/trpc", trpcExpress.createExpressMiddleware({ router: appRouter, createContext }));

  // Kept outside tRPC deliberately (see architecture notes in README):
  // streaming responses don't fit tRPC's request/response model cleanly.
  app.post("/api/conversation/:id/messages", (req, res) => {
    void streamConversationReply(req, res);
  });

  const port = env.PORT ?? env.API_PORT;
  app.listen(port, () => {
    console.log(`API listening on port ${port}`);
  });
}

main();
