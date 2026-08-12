import { useState } from "react";

import { useAuth } from "./AuthContext.js";

function errorMessage(err: unknown, mode: "login" | "register"): string {
  if (err instanceof Error && err.message) return err.message;
  return mode === "login"
    ? "Couldn't log in. Try again."
    : "Couldn't create your account. Try again.";
}

export function LoginPage(): React.JSX.Element {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent): Promise<void> {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      if (mode === "login") {
        await login(email, pin);
      } else {
        await register(email, pin);
      }
    } catch (err) {
      setError(errorMessage(err, mode));
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6">
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-12 w-12 shrink-0 -rotate-6 items-center justify-center rounded-full border-2 border-stamp text-stamp">
          <span className="font-serif text-sm font-bold tracking-wide">A1</span>
        </div>
        <div>
          <h1 className="font-serif text-2xl font-semibold tracking-tight text-ink">English A1</h1>
          <p className="text-sm text-ink/50">
            {mode === "login" ? "Welcome back — keep the streak going." : "Start your language journey."}
          </p>
        </div>
      </div>

      <form onSubmit={(event) => void handleSubmit(event)} className="space-y-4">
        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium text-ink/80">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full rounded border border-ink/15 bg-white px-3 py-2 text-base text-ink shadow-sm focus:border-ink"
            autoComplete="email"
            autoFocus
          />
        </div>

        <div>
          <label htmlFor="pin" className="mb-1 block text-sm font-medium text-ink/80">
            6-digit PIN
          </label>
          <input
            id="pin"
            type="password"
            inputMode="numeric"
            pattern="\d{6}"
            maxLength={6}
            required
            value={pin}
            onChange={(event) => setPin(event.target.value.replace(/\D/g, "").slice(0, 6))}
            className="w-full rounded border border-ink/15 bg-white px-3 py-2 text-base tracking-[0.3em] text-ink shadow-sm focus:border-ink"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
          />
          {mode === "register" && (
            <p className="mt-1 text-xs text-ink/50">
              Pick any 6 digits. There&rsquo;s no recovery, so remember it.
            </p>
          )}
        </div>

        {error && <p className="text-sm text-stamp">{error}</p>}

        <button
          type="submit"
          disabled={isSubmitting || pin.length !== 6}
          className="w-full rounded bg-ink px-4 py-2 text-sm font-medium text-paper transition hover:bg-ink-light disabled:opacity-40"
        >
          {isSubmitting ? "Please wait…" : mode === "login" ? "Log in" : "Create account"}
        </button>
      </form>

      <button
        type="button"
        onClick={() => {
          setMode(mode === "login" ? "register" : "login");
          setError(null);
        }}
        className="mt-6 text-sm font-medium text-ink/60 hover:text-ink"
      >
        {mode === "login" ? "New here? Create an account" : "Already have an account? Log in"}
      </button>
    </div>
  );
}
