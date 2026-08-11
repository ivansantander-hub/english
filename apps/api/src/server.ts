import { DEFAULT_USER_EMAIL, prisma } from "@english-a1/db";
import * as trpcExpress from "@trpc/server/adapters/express";
import cors from "cors";
import express from "express";
import type { Request, Response } from "express";

import { env } from "./config/env.js";
import { conversationService } from "./modules/conversation/router.js";
import { createContextFactory } from "./trpc/context.js";
import { appRouter } from "./trpc/router.js";

async function streamConversationReply(req: Request, res: Response, userId: string): Promise<void> {
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
    for await (const delta of conversationService.streamReply(conversationId, userId, content)) {
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

async function main(): Promise<void> {
  const user = await prisma.user.findUnique({ where: { email: DEFAULT_USER_EMAIL } });
  if (!user) {
    throw new Error(
      `Default user not found. Run "pnpm db:seed" before starting the API (looked for ${DEFAULT_USER_EMAIL}).`,
    );
  }

  const app = express();
  app.use(cors({ origin: env.APP_URL }));
  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.use(
    "/trpc",
    trpcExpress.createExpressMiddleware({
      router: appRouter,
      createContext: createContextFactory(user.id),
    }),
  );

  // Kept outside tRPC deliberately (see architecture notes in README):
  // streaming responses don't fit tRPC's request/response model cleanly.
  app.post("/api/conversation/:id/messages", (req, res) => {
    void streamConversationReply(req, res, user.id);
  });

  const port = env.PORT ?? env.API_PORT;
  app.listen(port, () => {
    console.log(`API listening on port ${port}`);
  });
}

main().catch((error: unknown) => {
  console.error("Failed to start API:", error);
  process.exitCode = 1;
});
