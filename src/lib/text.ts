/** Plain word count — whitespace-delimited; no tricks. */
export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

/** First N words of a body, for feed excerpts. Preserves internal newlines. */
export function excerpt(text: string, words = 40): string {
  const parts = text.trim().split(/\s+/);
  if (parts.length <= words) return text.trim();
  return parts.slice(0, words).join(" ") + " …";
}

/** Very light generic-phrase detection for the soft review nudges (never blocks). */
const GENERIC_PHRASES = [
  "i liked it",
  "it was good",
  "very good",
  "really good",
  "i enjoyed",
  "nice work",
  "well done",
  "keep it up",
  "good job",
];

export function softNudges(section: string): string[] {
  const nudges: string[] = [];
  const lower = section.toLowerCase();
  if (GENERIC_PHRASES.some((p) => lower.includes(p))) {
    nudges.push("This reads a little generic — quote the exact lines that earned the feeling.");
  }
  if (!/["“”'‘’]|\bline\b|\bstanza\b|\bstanza\b|\bverse\b|\bparagraph\b|\bscene\b/i.test(section)) {
    nudges.push("No line or stanza reference detected — point at the words themselves.");
  }
  return nudges;
}
