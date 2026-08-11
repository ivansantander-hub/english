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
      <h1 className="mb-1 font-serif text-2xl font-semibold tracking-tight">English A1</h1>
      <p className="mb-8 text-sm text-stone-500">
        {mode === "login"
          ? "Log in to continue practicing."
          : "Create your account to get started."}
      </p>

      <form onSubmit={(event) => void handleSubmit(event)} className="space-y-4">
        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium text-stone-700">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full rounded border border-stone-300 bg-white px-3 py-2 text-base shadow-sm focus:border-indigo-600"
            autoComplete="email"
            autoFocus
          />
        </div>

        <div>
          <label htmlFor="pin" className="mb-1 block text-sm font-medium text-stone-700">
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
            className="w-full rounded border border-stone-300 bg-white px-3 py-2 text-base tracking-[0.3em] shadow-sm focus:border-indigo-600"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
          />
          {mode === "register" && (
            <p className="mt-1 text-xs text-stone-500">
              Pick any 6 digits. There&rsquo;s no recovery, so remember it.
            </p>
          )}
        </div>

        {error && <p className="text-sm text-red-700">{error}</p>}

        <button
          type="submit"
          disabled={isSubmitting || pin.length !== 6}
          className="w-full rounded bg-stone-900 px-4 py-2 text-sm font-medium text-stone-50 transition hover:bg-stone-700 disabled:opacity-40"
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
        className="mt-6 text-sm font-medium text-stone-600 hover:text-stone-900"
      >
        {mode === "login" ? "New here? Create an account" : "Already have an account? Log in"}
      </button>
    </div>
  );
}
