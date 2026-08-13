const CACHE_TTL_MS = 60 * 60 * 1000;
const FETCH_TIMEOUT_MS = 5_000;

export interface ModelInfo {
  id: string;
  name: string;
  contextLength: number;
  promptPricePerToken: number;
  completionPricePerToken: number;
}

interface OpenRouterModelsResponse {
  data?: Array<{
    id?: string;
    name?: string;
    context_length?: number;
    architecture?: { input_modalities?: string[]; output_modalities?: string[] };
    pricing?: { prompt?: string; completion?: string };
  }>;
}

/**
 * A model works for this app if it accepts text input and produces
 * text-only output — this app only ever sends text prompts and needs a
 * text (JSON) response. Many good, cheap models (e.g. gpt-4o-mini) also
 * accept images/files as input; that doesn't disqualify them, since we
 * simply never send those. Excluding purely by "modality === text->text"
 * would silently drop most real chat models, including ones already used
 * in production.
 */
function isUsableTextModel(architecture: { input_modalities?: string[]; output_modalities?: string[] } | undefined): boolean {
  const inputs = architecture?.input_modalities ?? [];
  const outputs = architecture?.output_modalities ?? [];
  return inputs.includes("text") && outputs.length === 1 && outputs[0] === "text";
}

let cache: { data: ModelInfo[]; fetchedAt: number } | null = null;

/**
 * Fetches OpenRouter's public model catalog (no API key required), filtered
 * to text-in/text-out chat models — the only kind this app's features can
 * use. Cached in memory for an hour and bounded by a short timeout so a
 * slow/unreachable catalog never blocks a real user's evaluation,
 * conversation, or analysis request; callers should treat a thrown error
 * here as non-fatal.
 */
export async function fetchModelCatalog(baseUrl: string): Promise<ModelInfo[]> {
  if (cache && Date.now() - cache.fetchedAt < CACHE_TTL_MS) return cache.data;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(`${baseUrl}/models`, { signal: controller.signal });
    if (!response.ok) {
      throw new Error(`Failed to fetch OpenRouter model catalog (${response.status})`);
    }

    const json = (await response.json()) as OpenRouterModelsResponse;
    const data: ModelInfo[] = (json.data ?? [])
      .filter((model) => model.id && isUsableTextModel(model.architecture))
      .map((model) => ({
        id: model.id ?? "",
        name: model.name ?? model.id ?? "",
        contextLength: model.context_length ?? 0,
        promptPricePerToken: Number(model.pricing?.prompt ?? 0),
        completionPricePerToken: Number(model.pricing?.completion ?? 0),
      }))
      // A handful of routing/meta-models (e.g. openrouter/fusion) report "-1"
      // as a sentinel for "variable pricing, not a fixed per-token rate" —
      // not a real price. Excluding them keeps cost math honest and stops
      // them from sorting as "cheapest" ahead of every real-priced model.
      .filter((model) => model.promptPricePerToken >= 0 && model.completionPricePerToken >= 0);

    cache = { data, fetchedAt: Date.now() };
    return data;
  } finally {
    clearTimeout(timeout);
  }
}

export function computeCostUsd(
  promptTokens: number | undefined,
  completionTokens: number | undefined,
  model: ModelInfo | undefined,
): number | undefined {
  if (!model || promptTokens === undefined || completionTokens === undefined) return undefined;
  return promptTokens * model.promptPricePerToken + completionTokens * model.completionPricePerToken;
}
