import { useState } from "react";

import { trpc } from "../../lib/trpc.js";
import { useAuth } from "../auth/AuthContext.js";

interface AdminUser {
  id: string;
  email: string;
  role: "admin" | "user";
  createdAt: string | Date;
  exercisesCompleted: number;
  overallAccuracy: number;
}

function formatDate(iso: string | Date): string {
  const date = typeof iso === "string" ? new Date(iso) : iso;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export function AdminPage(): React.JSX.Element {
  const utils = trpc.useUtils();
  const usersQuery = trpc.admin.listUsers.useQuery();
  const { user: currentUser } = useAuth();

  if (usersQuery.isLoading) return <p className="text-ink/50">Loading users…</p>;
  if (usersQuery.isError || !usersQuery.data) {
    return <p className="text-red-700">Couldn&rsquo;t load users.</p>;
  }

  const users = usersQuery.data;

  return (
    <div className="space-y-6">
      <section>
        <p className="text-xs font-medium uppercase tracking-wide text-ink/50">Admin</p>
        <p className="mt-1 font-serif text-2xl font-semibold text-ink">All users</p>
        <p className="mt-2 max-w-md text-sm text-ink/60">
          {users.length} account{users.length === 1 ? "" : "s"}. Admins can see everyone&rsquo;s
          activity, promote or demote accounts, and reset a forgotten PIN.
        </p>
      </section>

      <div className="overflow-x-auto border-t border-ink/10">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-ink/10 text-xs uppercase tracking-wide text-ink/50">
              <th className="py-2 pr-4 font-medium">Email</th>
              <th className="py-2 pr-4 font-medium">Role</th>
              <th className="py-2 pr-4 font-medium">Exercises</th>
              <th className="py-2 pr-4 font-medium">Accuracy</th>
              <th className="py-2 pr-4 font-medium">Joined</th>
              <th className="py-2 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/10">
            {users.map((user) => (
              <UserRow
                key={user.id}
                user={user}
                isSelf={user.id === currentUser?.id}
                onChanged={() => void utils.admin.listUsers.invalidate()}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function UserRow({
  user,
  isSelf,
  onChanged,
}: {
  user: AdminUser;
  isSelf: boolean;
  onChanged: () => void;
}): React.JSX.Element {
  const [error, setError] = useState<string | null>(null);
  const [isResettingPin, setIsResettingPin] = useState(false);
  const [newPin, setNewPin] = useState("");

  const setRole = trpc.admin.setRole.useMutation();
  const resetPin = trpc.admin.resetPin.useMutation();

  async function toggleRole(): Promise<void> {
    setError(null);
    try {
      await setRole.mutateAsync({
        userId: user.id,
        role: user.role === "admin" ? "user" : "admin",
      });
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't update role.");
    }
  }

  async function submitPinReset(event: React.FormEvent): Promise<void> {
    event.preventDefault();
    setError(null);
    try {
      await resetPin.mutateAsync({ userId: user.id, newPin });
      setIsResettingPin(false);
      setNewPin("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't reset PIN.");
    }
  }

  return (
    <tr>
      <td className="py-2.5 pr-4 text-ink">
        {user.email}
        {isSelf && <span className="ml-1.5 text-xs text-ink/50">(you)</span>}
      </td>
      <td className="py-2.5 pr-4">
        <span
          className={`rounded px-1.5 py-0.5 text-xs font-medium ${
            user.role === "admin" ? "bg-gold/20 text-ink" : "bg-ink/5 text-ink/70"
          }`}
        >
          {user.role}
        </span>
      </td>
      <td className="py-2.5 pr-4 tabular-nums">{user.exercisesCompleted}</td>
      <td className="py-2.5 pr-4 tabular-nums">
        {user.exercisesCompleted > 0 ? `${Math.round(user.overallAccuracy * 100)}%` : "—"}
      </td>
      <td className="py-2.5 pr-4 text-ink/50">{formatDate(user.createdAt)}</td>
      <td className="py-2.5">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => void toggleRole()}
            disabled={setRole.isPending || isSelf}
            title={isSelf ? "You can't change your own role." : undefined}
            className="rounded border border-ink/15 px-2 py-1 text-xs font-medium text-ink/70 transition hover:bg-ink/5 disabled:opacity-40"
          >
            {user.role === "admin" ? "Remove admin" : "Make admin"}
          </button>
          {isResettingPin ? (
            <form
              onSubmit={(event) => void submitPinReset(event)}
              className="flex items-center gap-1"
            >
              <input
                type="text"
                inputMode="numeric"
                pattern="\d{6}"
                maxLength={6}
                required
                autoFocus
                value={newPin}
                onChange={(event) => setNewPin(event.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="New PIN"
                className="w-24 rounded border border-ink/15 px-2 py-1 text-xs tracking-widest"
              />
              <button
                type="submit"
                disabled={resetPin.isPending || newPin.length !== 6}
                className="rounded bg-ink px-2 py-1 text-xs font-medium text-paper disabled:opacity-40"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsResettingPin(false);
                  setNewPin("");
                }}
                className="text-xs text-ink/50 hover:text-ink"
              >
                Cancel
              </button>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setIsResettingPin(true)}
              className="rounded border border-ink/15 px-2 py-1 text-xs font-medium text-ink/70 transition hover:bg-ink/5"
            >
              Reset PIN
            </button>
          )}
        </div>
        {error && <p className="mt-1 text-xs text-red-700">{error}</p>}
      </td>
    </tr>
  );
}
