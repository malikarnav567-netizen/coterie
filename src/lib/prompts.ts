import type { CreativeLevel, Form } from "./enums";

export const REVIEW_PROMPTS: Record<Form, string[]> = {
  POETRY: ["Sound", "Line breaks", "Compression", "The turn"],
  PROSE: ["Pacing", "Voice", "Clarity", "Character"],
};

export const SECTION_2_PROMPT = "Where did you get pulled out of the piece, or confused?";

export const SECTION_LABELS = [
  { key: "whatWorked", numeral: "I", label: "What worked", hint: "Quote the lines that earned it." },
  {
    key: "whatDidNot",
    numeral: "II",
    label: "What did not",
    hint: SECTION_2_PROMPT,
  },
  {
    key: "oneSuggestion",
    numeral: "III",
    label: "One suggestion",
    hint: "One concrete change, not ten.",
  },
  { key: "readerResponse", numeral: "IV", label: "Your response (optional)", hint: "How the piece landed on you, as a reader." },
] as const;

export function levelMark(level: CreativeLevel | null): string {
  switch (level) {
    case "MENTOR":
      return "Mentor · Guide";
    case "MENTOR_CANDIDATE":
    case "TRUSTED":
      return "Trusted Reviewer";
    case "REVIEWER":
      return "Reviewer";
    case "AMATEUR":
      return "Amateur";
    default:
      return "Public";
  }
}

export function waitDays(from: Date | string): string {
  const then = typeof from === "string" ? new Date(from) : from;
  const days = Math.max(0, Math.floor((Date.now() - then.getTime()) / 86_400_000));
  return `Waiting: ${days} ${days === 1 ? "day" : "days"}`;
}
