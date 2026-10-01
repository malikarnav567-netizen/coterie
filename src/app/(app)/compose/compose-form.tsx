"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { PrimaryButton, Input, Textarea } from "@/components/ui";

const DRAFT_KEY = "coterie.compose.draft.v1";

export function ComposeForm({ genres }: { genres: string[] }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [form, setForm] = useState<"POETRY" | "PROSE">("POETRY");
  const [genre, setGenre] = useState(genres[0] ?? "Lyric");
  const [body, setBody] = useState("");
  const [intentLine, setIntentLine] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Draft autosave — restorable after refresh or accident.
  useEffect(() => {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (raw) {
      try {
        const d = JSON.parse(raw);
        if (d.title) setTitle(d.title);
        if (d.form) setForm(d.form);
        if (d.genre) setGenre(d.genre);
        if (d.body) setBody(d.body);
        if (d.intentLine) setIntentLine(d.intentLine);
      } catch {}
    }
  }, []);

  function scheduleSave(next: { title: string; form: string; genre: string; body: string; intentLine: string }) {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(next));
      setSavedAt(new Date().toLocaleTimeString());
    }, 800);
  }

  function update(setter: (v: string) => void, key: string) {
    return (v: string) => {
      setter(v);
      const snapshot = { title, form, genre, body, intentLine, [key]: v };
      scheduleSave({
        ...snapshot,
        [key]: v,
        title: key === "title" ? v : title,
        form: key === "form" ? v : form,
        genre: key === "genre" ? v : genre,
        body: key === "body" ? v : body,
        intentLine: key === "intentLine" ? v : intentLine,
      } as never);
    };
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, form, genre, body, intentLine: intentLine || null }),
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.removeItem(DRAFT_KEY);
        router.push(`/post/${data.id}`);
      } else {
        setError(data.fieldErrors ? Object.values(data.fieldErrors)[0] : data.error);
      }
    } finally {
      setBusy(false);
    }
  }

  const words = body.trim() ? body.trim().split(/\s+/).length : 0;

  return (
    <form onSubmit={submit} className="mt-8 space-y-6">
      <Input label="Title" required value={title} onChange={(e) => update(setTitle, "title")(e.target.value)} placeholder="The name on the cover" />
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <span className="label-caps mb-2 block text-muted">Form</span>
          <div className="flex gap-2">
            {(["POETRY", "PROSE"] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setForm(f)}
                aria-pressed={form === f}
                className={`label-caps border px-4 py-2 ${form === f ? "border-gold text-gold" : "border-gold-dim/50 text-muted hover:text-ivory"}`}
              >
                {f.charAt(0) + f.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>
        <label className="block">
          <span className="label-caps mb-2 block text-muted">Genre</span>
          <select
            value={genre}
            onChange={(e) => update(setGenre, "genre")(e.target.value)}
            className="w-full border border-gold-dim bg-ink-3 px-3 py-2.5 font-[family-name:var(--font-body)] text-[16px] text-ivory focus:border-gold focus:outline-none"
          >
            {genres.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div>
        <Textarea
          label="The piece itself"
          required
          value={body}
          onChange={(e) => update(setBody, "body")(e.target.value)}
          rows={14}
          placeholder={"Line breaks and stanza spacing are kept exactly as typed."}
          className="min-h-64 leading-relaxed"
        />
        <p className="label-caps mt-1.5 text-right text-muted">{words} words</p>
      </div>

      <Input
        label="Intent line (optional) — “I am trying to…”"
        value={intentLine}
        onChange={(e) => update(setIntentLine, "intentLine")(e.target.value)}
        placeholder="I am trying to…"
      />

      {error && (
        <p className="border border-oxblood-bright/60 bg-oxblood/20 px-3 py-2 text-sm text-[#e0a3a3]" role="alert">
          {error}
        </p>
      )}

      <div className="flex items-center justify-between">
        <span className="label-caps text-muted">{savedAt ? `Draft saved ${savedAt}` : "Draft autosaves as you write"}</span>
        <PrimaryButton type="submit" disabled={busy || !title || !body}>
          {busy ? "Setting the page…" : "Set the page"}
        </PrimaryButton>
      </div>
    </form>
  );
}
