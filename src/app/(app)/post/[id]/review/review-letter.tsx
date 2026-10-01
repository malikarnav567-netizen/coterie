"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

const SECTIONS = [
  { key: "whatWorked", numeral: "I", label: "What worked" },
  { key: "whatDidNot", numeral: "II", label: "What did not" },
  { key: "oneSuggestion", numeral: "III", label: "One suggestion" },
  { key: "readerResponse", numeral: "IV", label: "Your response (optional)" },
] as const;

function words(s: string) {
  return s.trim() ? s.trim().split(/\s+/).length : 0;
}

export function ReviewLetter({
  postId,
  minWords,
  prompts,
  section2Prompt,
}: {
  postId: string;
  minWords: number;
  prompts: string[];
  section2Prompt: string;
  form: string;
}) {
  const router = useRouter();
  const [values, setValues] = useState<Record<string, string>>({
    whatWorked: "",
    whatDidNot: "",
    oneSuggestion: "",
    readerResponse: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const set = (key: string, v: string) => setValues((prev) => ({ ...prev, [key]: v }));

  const valid = SECTIONS.filter((s) => s.key !== "readerResponse").every(
    (s) => words(values[s.key]) >= minWords,
  );

  const nudges = useMemo(() => {
    const n: string[] = [];
    const text = values.whatWorked + " " + values.whatDidNot + " " + values.oneSuggestion;
    if (text && !/["“”']|\bline\b|\bstanza\b|\bverse\b|\bparagraph\b|\bscene\b/i.test(text)) {
      n.push("No line or stanza reference detected — point at the words themselves.");
    }
    if (/^(i liked it|i enjoyed it|it was good|very good|nice work)\.?$/i.test(values.whatWorked.trim())) {
      n.push("“I liked it” is a feeling, not a critique — quote the exact lines that earned it.");
    }
    return n;
  }, [values]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setServerError(null);
    setErrors({});
    try {
      const res = await fetch(`/api/posts/${postId}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json();
      if (res.ok) {
        router.push(`/post/${postId}`);
      } else {
        if (data.fieldErrors) setErrors(data.fieldErrors);
        setServerError(data.error ?? "The letter could not be sealed.");
      }
    } finally {
      setBusy(false);
    }
  }

  const hintFor = (key: string) =>
    key === "whatDidNot" ? section2Prompt : key === "oneSuggestion" ? "One concrete change, not ten." : undefined;

  return (
    <form onSubmit={submit} className="mt-8 space-y-8">
      {SECTIONS.map((s, idx) => {
        const required = s.key !== "readerResponse";
        const n = words(values[s.key]);
        const optional = !required;
        return (
          <div key={s.key} className="border-t border-[color:var(--color-parchment-ink)]/20 pt-6 first:border-t-0 first:pt-0">
            <div className="flex items-baseline justify-between gap-3">
              <label htmlFor={`sec-${s.key}`} className="display-caps text-base text-[color:var(--color-parchment-ink)]">
                {s.numeral} · {s.label}
              </label>
              <span
                className={`label-caps shrink-0 ${optional ? "text-[color:var(--color-parchment-ink)]/50" : n >= minWords ? "text-[#4c6b3c]" : "text-[color:var(--color-parchment-ink)]/60"}`}
                aria-live="polite"
              >
                {optional ? "optional" : `${n} / ${minWords}`}
              </span>
            </div>
            {hintFor(s.key) && (
              <p className="accent-italic mt-1 !text-[color:var(--color-parchment-ink)]/60 text-sm">{hintFor(s.key)}</p>
            )}
            <textarea
              id={`sec-${s.key}`}
              value={values[s.key]}
              onChange={(e) => set(s.key, e.target.value)}
              rows={s.key === "oneSuggestion" ? 3 : 4}
              placeholder={
                s.key === "whatWorked"
                  ? `Begin with the ${prompts[0].toLowerCase()}…`
                  : s.key === "whatDidNot"
                    ? "Where the reader stumbles…"
                    : s.key === "oneSuggestion"
                      ? "The single change you would make…"
                      : "How the piece landed on you…"
              }
              aria-describedby={errors[s.key] ? `err-${s.key}` : undefined}
              className="mt-3 w-full border border-[color:var(--color-parchment-ink)]/25 bg-[color:var(--color-parchment)]/60 px-3 py-2.5 font-[family-name:var(--font-body)] text-[15px] leading-relaxed text-[color:var(--color-parchment-ink)] placeholder:text-[color:var(--color-parchment-ink)]/40 focus:border-[color:var(--color-parchment-ink)]/60 focus:outline-none"
            />
            {errors[s.key] && (
              <p id={`err-${s.key}`} className="mt-1 text-sm text-[#8a3a2e]" role="alert">
                {errors[s.key]}
              </p>
            )}
          </div>
        );
      })}

      {nudges.length > 0 && (
        <div className="border border-[color:var(--color-parchment-ink)]/20 bg-[color:var(--color-parchment)]/50 px-4 py-3" role="status">
          {nudges.map((n) => (
            <p key={n} className="text-sm italic text-[color:var(--color-parchment-ink)]/70">
              {n}
            </p>
          ))}
        </div>
      )}

      {serverError && (
        <p className="border border-[#8a3a2e]/50 bg-[#8a3a2e]/10 px-3 py-2 text-sm text-[#8a3a2e]" role="alert">
          {serverError}
        </p>
      )}

      <div className="flex items-center justify-between">
        <p className="text-sm italic text-[color:var(--color-parchment-ink)]/60">
          Reviews lock once they are rated.
        </p>
        <button
          type="submit"
          disabled={busy || !valid}
          className="label-caps inline-flex items-center gap-2 border border-[color:var(--color-parchment-ink)]/40 bg-[color:var(--color-oxblood)] px-6 py-3 text-gold-light transition-colors hover:bg-[color:var(--color-oxblood-bright)] disabled:opacity-40"
        >
          {busy ? "Sealing…" : "Seal & Send"}
        </button>
      </div>
    </form>
  );
}
