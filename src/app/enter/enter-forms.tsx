"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { PrimaryButton, SecondaryButton, Input } from "@/components/ui";

/**
 * The only door: a 6-digit code sent to a college inbox. No passwords.
 * Stage one collects the email, stage two the code. The campus-domain gate
 * fires on the exchange — a verified inbox that is not a college address
 * proves it controls an inbox, but the door stays shut.
 */
export function EnterForms({ next }: { next: string }) {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [stage, setStage] = useState<"email" | "code">("email");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function resetOtp() {
    setStage("email");
    setCode("");
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setBusy(true);
    try {
      if (stage === "email") {
        const res = await fetch("/api/auth/otp/request", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? "The letter could not be sent.");
        } else {
          setStage("code");
          setNotice(data.notice ?? "The 6-digit code is on its way.");
        }
      } else {
        const res = await fetch("/api/auth/otp/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, code }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? "The code did not match.");
          return;
        }
        const login = await signIn("otp", { email, ticket: data.ticket, redirect: false });
        if (login?.error) {
          setError("The code checked out but the door would not open. Try again.");
          resetOtp();
        } else {
          window.location.href = next;
        }
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <form onSubmit={submit} className="space-y-4">
        {stage === "code" ? (
          <Input
            label="6-digit code"
            type="text"
            required
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            placeholder="······"
            className="text-center tracking-[0.5em]"
          />
        ) : (
          <Input
            label="College email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@ipec.org.in"
            autoComplete="email"
          />
        )}

        {error && (
          <p className="border border-oxblood-bright/60 bg-oxblood/20 px-3 py-2 text-sm text-[#e0a3a3]" role="alert">
            {error}
          </p>
        )}
        {notice && (
          <p className="border border-gold-dim/60 bg-ink-3 px-3 py-2 text-sm text-gold-light" role="status">
            {notice}
          </p>
        )}

        {stage === "code" ? (
          <div className="space-y-2">
            <PrimaryButton type="submit" disabled={busy} className="w-full justify-center">
              {busy ? "Checking the seal…" : "Verify and enter"}
            </PrimaryButton>
            <button
              type="button"
              onClick={resetOtp}
              className="label-caps w-full text-center text-xs text-muted hover:text-ivory"
            >
              Use a different email
            </button>
          </div>
        ) : (
          <SecondaryButton type="submit" disabled={busy} className="w-full justify-center">
            {busy ? "Sealing the letter…" : "Send the code"}
          </SecondaryButton>
        )}
      </form>

      <p className="mt-5 text-center text-sm text-muted">
        {stage === "code"
          ? `Six digits were sent to ${email}. They open the door once and expire in ten minutes.`
          : "We send a one-time 6-digit code to your college inbox. No password to forget — your first letter enrolls you."}
      </p>
    </div>
  );
}
