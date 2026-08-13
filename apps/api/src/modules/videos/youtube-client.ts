const SEARCH_TIMEOUT_MS = 8_000;
const MAX_RESULTS = 5;

/**
 * Channels known to teach English grammar clearly for A1/A2 learners —
 * results from these are preferred, never required (a niche topic still
 * gets a real result even if none of these six covered it). Researched
 * and confirmed as real, established channels, not guessed.
 */
export const ENGLISH_TRUSTED_CHANNELS = [
  "bbc learning english",
  "english with lucy",
  "jenniferesl",
  "englishclass101",
  "voa learning english",
  "lingoni english",
];

/**
 * Channels that teach English with the explanation itself in Spanish —
 * for learners whose English isn't yet strong enough to follow an
 * English-only lesson. Researched and confirmed as real, established
 * channels, not guessed.
 */
export const SPANISH_TRUSTED_CHANNELS = ["profesor diego", "francisco ochoa", "mr. salas"];

export interface YouTubeSearchResult {
  videoId: string;
  title: string;
  channelName: string;
  thumbnailUrl: string;
}

interface YouTubeSearchResponse {
  items?: Array<{
    id?: { videoId?: string };
    snippet?: {
      title?: string;
      channelTitle?: string;
      thumbnails?: { medium?: { url?: string }; default?: { url?: string } };
    };
  }>;
}

function isTrustedChannel(channelName: string, trustedChannels: string[]): boolean {
  const normalized = channelName.trim().toLowerCase();
  return trustedChannels.some((trusted) => normalized.includes(trusted));
}

/**
 * Searches YouTube for a query, preferring results from trustedChannels
 * (sorted first) without excluding everything else — a topic with no
 * trusted-channel match still gets the most relevant real result.
 */
export async function searchYouTube(
  apiKey: string,
  query: string,
  trustedChannels: string[],
  relevanceLanguage: "en" | "es",
): Promise<YouTubeSearchResult[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), SEARCH_TIMEOUT_MS);

  try {
    const url = new URL("https://www.googleapis.com/youtube/v3/search");
    url.searchParams.set("part", "snippet");
    url.searchParams.set("type", "video");
    url.searchParams.set("maxResults", String(MAX_RESULTS));
    url.searchParams.set("safeSearch", "strict");
    url.searchParams.set("relevanceLanguage", relevanceLanguage);
    url.searchParams.set("q", query);
    url.searchParams.set("key", apiKey);

    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) {
      const body = await response.text().catch(() => "");
      throw new Error(`YouTube search failed (${response.status}): ${body.slice(0, 300)}`);
    }

    const json = (await response.json()) as YouTubeSearchResponse;
    const results: YouTubeSearchResult[] = (json.items ?? [])
      .filter((item) => item.id?.videoId && item.snippet?.title)
      .map((item) => ({
        videoId: item.id?.videoId ?? "",
        title: item.snippet?.title ?? "",
        channelName: item.snippet?.channelTitle ?? "",
        thumbnailUrl:
          item.snippet?.thumbnails?.medium?.url ?? item.snippet?.thumbnails?.default?.url ?? "",
      }));

    return [...results].sort(
      (a, b) =>
        Number(isTrustedChannel(b.channelName, trustedChannels)) -
        Number(isTrustedChannel(a.channelName, trustedChannels)),
    );
  } finally {
    clearTimeout(timeout);
  }
}
