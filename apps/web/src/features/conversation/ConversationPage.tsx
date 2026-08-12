import { useState } from "react";

import { getStoredToken } from "../../lib/auth-storage.js";
import { API_URL } from "../../lib/config.js";
import { trpc } from "../../lib/trpc.js";

interface DisplayMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

function formatDate(iso: string | Date): string {
  const date = typeof iso === "string" ? new Date(iso) : iso;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export function ConversationPage(): React.JSX.Element {
  const [conversationId, setConversationId] = useState<string | null>(null);

  return conversationId ? (
    <ChatView conversationId={conversationId} onBack={() => setConversationId(null)} />
  ) : (
    <ConversationList onOpen={setConversationId} />
  );
}

function ConversationList({
  onOpen,
}: {
  onOpen: (conversationId: string) => void;
}): React.JSX.Element {
  const list = trpc.conversation.list.useQuery();
  const startConversation = trpc.conversation.start.useMutation();
  const [error, setError] = useState<string | null>(null);

  function handleNew(): void {
    setError(null);
    void startConversation
      .mutateAsync()
      .then((data) => onOpen(data.conversationId))
      .catch(() => setError("Couldn't start a conversation. Is the API running?"));
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-xl font-extrabold text-ink">Conversation practice</h2>
        <button
          type="button"
          onClick={handleNew}
          disabled={startConversation.isPending}
          className="rounded-xl bg-coral px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5 disabled:opacity-40 disabled:hover:translate-y-0"
        >
          {startConversation.isPending ? "Starting…" : "New conversation"}
        </button>
      </div>

      {error && <p className="text-sm text-red-700">{error}</p>}

      {list.isLoading && <p className="text-ink/50">Loading conversations…</p>}
      {list.isError && <p className="text-red-700">Couldn&rsquo;t load your conversations.</p>}

      {list.data && list.data.length === 0 && (
        <p className="text-ink/50">
          No conversations yet. Start one above to practice speaking naturally with a tutor.
        </p>
      )}

      {list.data && list.data.length > 0 && (
        <ul className="divide-y divide-ink/10 border-t border-ink/10">
          {list.data.map((conversation) => (
            <li key={conversation.id}>
              <button
                type="button"
                onClick={() => onOpen(conversation.id)}
                className="flex w-full items-baseline justify-between gap-4 rounded-xl px-2 py-3 text-left hover:bg-coral-tint"
              >
                <span className="min-w-0 flex-1 truncate text-ink">{conversation.preview}</span>
                <span className="shrink-0 text-sm text-ink/50">
                  {formatDate(conversation.startedAt)} · {conversation.messageCount}{" "}
                  {conversation.messageCount === 1 ? "message" : "messages"}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function TypingDots(): React.JSX.Element {
  return (
    <span className="inline-flex items-center gap-1" aria-label="Tutor is typing">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-1.5 w-1.5 animate-bounce rounded-full bg-ink/40"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </span>
  );
}

function ChatView({
  conversationId,
  onBack,
}: {
  conversationId: string;
  onBack: () => void;
}): React.JSX.Element {
  const historyQuery = trpc.conversation.getHistory.useQuery({ conversationId });
  const [liveMessages, setLiveMessages] = useState<DisplayMessage[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const messages = [...(historyQuery.data ?? []), ...liveMessages];

  async function handleSend(event: React.FormEvent): Promise<void> {
    event.preventDefault();
    const content = input.trim();
    if (!content || isStreaming) return;

    setError(null);
    setInput("");
    setLiveMessages((prev) => [...prev, { id: `user-${Date.now()}`, role: "user", content }]);

    const assistantId = `assistant-${Date.now()}`;
    setLiveMessages((prev) => [...prev, { id: assistantId, role: "assistant", content: "" }]);
    setIsStreaming(true);

    try {
      const token = getStoredToken();
      const response = await fetch(`${API_URL}/api/conversation/${conversationId}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ content }),
      });
      if (response.status === 401) throw new Error("Your session expired. Log in again.");
      if (!response.ok || !response.body) throw new Error("Request failed");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const events = buffer.split("\n\n");
        buffer = events.pop() ?? "";

        for (const event of events) {
          const dataLine = event.split("\n").find((line) => line.startsWith("data:"));
          if (!dataLine) continue;
          const payload = JSON.parse(dataLine.slice("data:".length).trim()) as {
            delta?: string;
            message?: string;
          };
          if (event.startsWith("event: error")) {
            setError(payload.message ?? "Something went wrong.");
          } else if (payload.delta) {
            setLiveMessages((prev) =>
              prev.map((message) =>
                message.id === assistantId
                  ? { ...message, content: message.content + payload.delta }
                  : message,
              ),
            );
          }
        }
      }
    } catch (err) {
      setError(
        err instanceof Error && err.message === "Your session expired. Log in again."
          ? err.message
          : "Lost connection to the tutor. Try sending your message again.",
      );
    } finally {
      setIsStreaming(false);
    }
  }

  return (
    <div className="flex h-[70vh] flex-col">
      <button
        type="button"
        onClick={onBack}
        className="mb-4 self-start text-sm font-medium text-ink/60 hover:text-ink"
      >
        ← All conversations
      </button>

      {historyQuery.isLoading && <p className="text-ink/50">Loading…</p>}

      <div className="flex-1 space-y-4 overflow-y-auto pr-1">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-base leading-relaxed shadow-sm ${
              message.role === "assistant"
                ? "border border-ink/10 bg-white text-ink"
                : "ml-auto bg-coral text-white"
            }`}
          >
            {message.content ||
              (message.role === "assistant" && isStreaming ? <TypingDots /> : "")}
          </div>
        ))}
      </div>

      {error && <p className="mt-2 text-sm text-red-700">{error}</p>}

      <form
        onSubmit={(event) => void handleSend(event)}
        className="mt-4 flex gap-2 border-t border-ink/10 pt-4"
      >
        <label htmlFor="conversation-input" className="sr-only">
          Your message
        </label>
        <input
          id="conversation-input"
          type="text"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          disabled={isStreaming}
          placeholder="Type your reply in English…"
          className="flex-1 rounded-xl border border-ink/15 bg-white px-3.5 py-2.5 text-base text-ink shadow-sm focus:border-coral"
          autoFocus
        />
        <button
          type="submit"
          disabled={isStreaming || input.trim().length === 0}
          className="rounded-xl bg-coral px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5 disabled:opacity-40 disabled:hover:translate-y-0"
        >
          Send
        </button>
      </form>
    </div>
  );
}
