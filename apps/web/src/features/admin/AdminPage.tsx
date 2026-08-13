import { useEffect, useState } from "react";

import type { LLMUsageSummary, ModelInfo } from "../../lib/trpc-types.js";
import { trpc } from "../../lib/trpc.js";
import { useAuth } from "../auth/AuthContext.js";

interface AdminUser {
  id: string;
  email: string;
  role: "admin" | "user";
  createdAt: string | Date;
  exercisesCompleted: number;
  exercisesSkipped: number;
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
    return <p className="text-red-700 dark:text-red-400">Couldn&rsquo;t load users.</p>;
  }

  const users = usersQuery.data;

  return (
    <div className="space-y-6">
      <section>
        <p className="text-xs font-medium uppercase tracking-wide text-ink/50">Admin</p>
        <p className="mt-1 font-serif text-2xl font-extrabold text-ink">All users</p>
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
              <th className="py-2 pr-4 font-medium">Skipped</th>
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

      <AISettingsCard />
      <AIUsagePanel />
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
          className={`rounded-md px-1.5 py-0.5 text-xs font-bold ${
            user.role === "admin" ? "bg-gold-tint text-ink" : "bg-ink/5 text-ink/70"
          }`}
        >
          {user.role}
        </span>
      </td>
      <td className="py-2.5 pr-4 tabular-nums">{user.exercisesCompleted}</td>
      <td className="py-2.5 pr-4 tabular-nums">{user.exercisesSkipped}</td>
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
                className="rounded-md bg-sky px-2 py-1 text-xs font-bold text-white disabled:opacity-40"
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
        {error && <p className="mt-1 text-xs text-red-700 dark:text-red-400">{error}</p>}
      </td>
    </tr>
  );
}

function formatPricePerMillion(pricePerToken: number): string {
  const perMillion = pricePerToken * 1_000_000;
  return perMillion === 0 ? "free" : `$${perMillion.toFixed(2)}/1M`;
}

function ModelSelect({
  id,
  label,
  value,
  onChange,
  models,
  allowDefault,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  models: ModelInfo[];
  allowDefault?: boolean;
}): React.JSX.Element {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-xs font-semibold text-ink/70">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-lg border border-ink/15 bg-surface px-2 py-1.5 text-sm text-ink"
      >
        {allowDefault && <option value="">Use default model</option>}
        {models.map((model) => (
          <option key={model.id} value={model.id}>
            {model.id} — {formatPricePerMillion(model.promptPricePerToken)} /{" "}
            {formatPricePerMillion(model.completionPricePerToken)}
          </option>
        ))}
      </select>
    </div>
  );
}

function AISettingsCard(): React.JSX.Element {
  const utils = trpc.useUtils();
  const modelsQuery = trpc.admin.listModels.useQuery();
  const settingsQuery = trpc.admin.getAISettings.useQuery();
  const updateSettings = trpc.admin.updateAISettings.useMutation({
    onSuccess: () => void utils.admin.getAISettings.invalidate(),
  });

  const [defaultModel, setDefaultModel] = useState("");
  const [evaluationModel, setEvaluationModel] = useState("");
  const [conversationModel, setConversationModel] = useState("");
  const [analysisModel, setAnalysisModel] = useState("");

  useEffect(() => {
    if (!settingsQuery.data) return;
    setDefaultModel(settingsQuery.data.defaultModel);
    setEvaluationModel(settingsQuery.data.evaluationModel ?? "");
    setConversationModel(settingsQuery.data.conversationModel ?? "");
    setAnalysisModel(settingsQuery.data.analysisModel ?? "");
  }, [settingsQuery.data]);

  if (modelsQuery.isLoading || settingsQuery.isLoading) {
    return <p className="text-sm text-ink/50">Loading AI settings…</p>;
  }
  if (modelsQuery.isError || !modelsQuery.data) {
    return <p className="text-sm text-berry">Couldn&rsquo;t load the model list.</p>;
  }

  const models = [...modelsQuery.data].sort(
    (a, b) => a.promptPricePerToken - b.promptPricePerToken,
  );

  function handleSave(): void {
    updateSettings.mutate({
      defaultModel,
      evaluationModel: evaluationModel || null,
      conversationModel: conversationModel || null,
      analysisModel: analysisModel || null,
    });
  }

  return (
    <section className="space-y-4 rounded-2xl bg-surface p-5 shadow-sm">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-ink/50">AI settings</p>
        <p className="mt-1 max-w-md text-sm text-ink/60">
          Which model each AI feature uses. Changes apply immediately — no redeploy needed.
        </p>
      </div>

      <ModelSelect
        id="default-model"
        label="Default model"
        value={defaultModel}
        onChange={setDefaultModel}
        models={models}
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <ModelSelect
          id="evaluation-model"
          label="Evaluation override"
          value={evaluationModel}
          onChange={setEvaluationModel}
          models={models}
          allowDefault
        />
        <ModelSelect
          id="conversation-model"
          label="Talk override"
          value={conversationModel}
          onChange={setConversationModel}
          models={models}
          allowDefault
        />
        <ModelSelect
          id="analysis-model"
          label="Profile analysis override"
          value={analysisModel}
          onChange={setAnalysisModel}
          models={models}
          allowDefault
        />
      </div>

      <button
        type="button"
        onClick={handleSave}
        disabled={updateSettings.isPending || !defaultModel}
        className="rounded-xl bg-sky px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5 disabled:opacity-40"
      >
        {updateSettings.isPending ? "Saving…" : "Save AI settings"}
      </button>
      {updateSettings.isSuccess && <p className="text-xs font-semibold text-mint">Saved.</p>}
      {updateSettings.isError && (
        <p className="text-xs font-semibold text-berry">Couldn&rsquo;t save. Try again.</p>
      )}
    </section>
  );
}

function formatCost(costUsd: number | null | undefined): string {
  if (costUsd === null || costUsd === undefined) return "—";
  if (costUsd === 0) return "$0.00";
  return costUsd < 0.01 ? "<$0.01" : `$${costUsd.toFixed(2)}`;
}

const REQUEST_TYPE_LABEL: Record<string, string> = {
  evaluation: "Evaluation",
  conversation: "Talk",
  analysis: "Profile analysis",
  generation: "Generation",
  explanation: "Explanation",
};

function AIUsagePanel(): React.JSX.Element {
  const usageQuery = trpc.admin.getLLMUsage.useQuery();

  if (usageQuery.isLoading) return <p className="text-sm text-ink/50">Loading AI usage…</p>;
  if (usageQuery.isError || !usageQuery.data) {
    return <p className="text-sm text-berry">Couldn&rsquo;t load AI usage.</p>;
  }

  const { totals, byType, byModel, recent } = usageQuery.data;
  const successRate =
    totals.totalRequests > 0
      ? Math.round((totals.successfulRequests / totals.totalRequests) * 100)
      : 0;

  return (
    <section className="space-y-5 rounded-2xl bg-surface p-5 shadow-sm">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-ink/50">AI usage</p>
        <p className="mt-1 text-sm text-ink/60">
          Everything logged from every AI call, across every user.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat label="Total cost" value={formatCost(totals.totalCostUsd)} />
        <Stat label="Requests" value={String(totals.totalRequests)} />
        <Stat label="Success rate" value={`${successRate}%`} />
        <Stat
          label="Tokens"
          value={(totals.totalPromptTokens + totals.totalCompletionTokens).toLocaleString()}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <BreakdownTable
          title="By feature"
          rows={byType}
          labelFor={(key) => REQUEST_TYPE_LABEL[key] ?? key}
        />
        <BreakdownTable title="By model" rows={byModel} labelFor={(key) => key} />
      </div>

      <div>
        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-ink/50">
          Recent requests
        </p>
        <div className="overflow-x-auto border-t border-ink/10">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-ink/10 text-xs uppercase tracking-wide text-ink/50">
                <th className="py-2 pr-4 font-medium">When</th>
                <th className="py-2 pr-4 font-medium">User</th>
                <th className="py-2 pr-4 font-medium">Feature</th>
                <th className="py-2 pr-4 font-medium">Model</th>
                <th className="py-2 pr-4 font-medium">Tokens</th>
                <th className="py-2 pr-4 font-medium">Cost</th>
                <th className="py-2 pr-4 font-medium">Latency</th>
                <th className="py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/10">
              {recent.map((row) => (
                <tr key={row.id}>
                  <td className="py-2 pr-4 text-ink/50">
                    {new Date(row.createdAt).toLocaleString(undefined, {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className="py-2 pr-4 text-ink">{row.userEmail ?? "—"}</td>
                  <td className="py-2 pr-4 text-ink/70">
                    {REQUEST_TYPE_LABEL[row.requestType] ?? row.requestType}
                  </td>
                  <td className="py-2 pr-4 text-ink/70">{row.model}</td>
                  <td className="py-2 pr-4 tabular-nums text-ink/70">
                    {row.promptTokens !== null ? `${row.promptTokens}+${row.completionTokens ?? 0}` : "—"}
                  </td>
                  <td className="py-2 pr-4 tabular-nums text-ink/70">{formatCost(row.costUsd)}</td>
                  <td className="py-2 pr-4 tabular-nums text-ink/50">{row.latencyMs}ms</td>
                  <td className="py-2">
                    <span
                      className={`rounded-md px-1.5 py-0.5 text-xs font-bold ${
                        row.success ? "bg-mint-tint text-ink" : "bg-berry-tint text-ink"
                      }`}
                    >
                      {row.success ? "OK" : "Failed"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }): React.JSX.Element {
  return (
    <div>
      <p className="font-serif text-2xl font-extrabold tabular-nums text-ink">{value}</p>
      <p className="mt-0.5 text-xs font-semibold text-ink/55">{label}</p>
    </div>
  );
}

function BreakdownTable({
  title,
  rows,
  labelFor,
}: {
  title: string;
  rows: LLMUsageSummary["byType"];
  labelFor: (key: string) => string;
}): React.JSX.Element {
  return (
    <div>
      <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-ink/50">{title}</p>
      {rows.length === 0 ? (
        <p className="text-sm text-ink/40">No data yet.</p>
      ) : (
        <ul className="space-y-1 text-sm">
          {rows.map((row) => (
            <li key={row.key} className="flex items-center justify-between gap-2">
              <span className="truncate text-ink/70">{labelFor(row.key)}</span>
              <span className="shrink-0 tabular-nums text-ink/50">
                {row.count} · {formatCost(row.costUsd)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
