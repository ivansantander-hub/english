/**
 * Splits a paragraph answer into individual sentences for per-sentence
 * scoring. Deliberately simple (no abbreviation handling) — content at this
 * level never uses abbreviations that would confuse a "., !, ?" split.
 */
export function splitIntoSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 0);
}
