const SEARCH_TIMEOUT_MS = 8_000;
const MAX_RESULTS = 5;

/**
 * Channels known to teach English grammar clearly for A1/A2 learners —
 * results from these are preferred, never required (a niche topic still
 * gets a real result even if none of these six covered it). Researched
 * and confirmed as real, established channels, not guessed.
 */
const TRUSTED_CHANNELS = [
  "bbc learning english",
  "english with lucy",
  "jenniferesl",
  "englishclass101",
  "voa learning english",
  "lingoni english",
];

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

function isTrustedChannel(channelName: string): boolean {
  const normalized = channelName.trim().toLowerCase();
  return TRUSTED_CHANNELS.some((trusted) => normalized.includes(trusted));
}

/**
 * Searches YouTube for a query, preferring results from TRUSTED_CHANNELS
 * (sorted first) without excluding everything else — a topic with no
 * trusted-channel match still gets the most relevant real result.
 */
export async function searchYouTube(apiKey: string, query: string): Promise<YouTubeSearchResult[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), SEARCH_TIMEOUT_MS);

  try {
    const url = new URL("https://www.googleapis.com/youtube/v3/search");
    url.searchParams.set("part", "snippet");
    url.searchParams.set("type", "video");
    url.searchParams.set("maxResults", String(MAX_RESULTS));
    url.searchParams.set("safeSearch", "strict");
    url.searchParams.set("relevanceLanguage", "en");
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

    return [...results].sort((a, b) => Number(isTrustedChannel(b.channelName)) - Number(isTrustedChannel(a.channelName)));
  } finally {
    clearTimeout(timeout);
  }
}
