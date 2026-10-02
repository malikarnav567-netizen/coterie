"use client";

import { useEffect, useMemo, useState } from "react";

type Status = "ACTIVE" | "PENDING" | "SUSPENDED";

type Member = {
  id: string;
  email: string;
  displayName: string;
  accessTier: string;
  creativeLevel: string | null;
  isAdmin: boolean;
  universalAdmin: boolean;
  status: string;
  identityVerified: boolean;
  campus: string;
  createdAt: string;
};

const BADGE: Record<Status, string> = {
  ACTIVE: "border-gold-dim text-gold",
  PENDING: "border-parchment-deep/70 text-parchment",
  SUSPENDED: "border-oxblood-bright text-[#e0a3a3]",
};

const LABEL: Record<Status, string> = {
  ACTIVE: "Active",
  PENDING: "Pending",
  SUSPENDED: "Denied",
};

export function MembersTable({ members, selfId }: { members: Member[]; selfId: string }) {
  const [rows, setRows] = useState<Member[]>(members);
  const [query, setQuery] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);

  // Re-sync whenever the server hands down a fresh roster.
  useEffect(() => setRows(members), [members]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (m) => m.email.toLowerCase().includes(q) || m.displayName.toLowerCase().includes(q),
    );
  }, [rows, query]);

  const counts = useMemo(
    () => ({
      active: rows.filter((m) => m.status === "ACTIVE").length,
      pending: rows.filter((m) => m.status === "PENDING").length,
      denied: rows.filter((m) => m.status === "SUSPENDED").length,
      total: rows.length,
    }),
    [rows],
  );

  async function decide(member: Member, next: Status) {
    const prev = member.status;
    setError(null);
    setNote(null);
    setBusyId(member.id);
    // Optimistic: the row answers on the first tap, the network catches up.
    setRows((rs) => rs.map((r) => (r.id === member.id ? { ...r, status: next } : r)));
    try {
      const res = await fetch("/api/admin/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: member.id, status: next }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setRows((rs) => rs.map((r) => (r.id === member.id ? { ...r, status: prev } : r)));
        setError(data.error ?? "The decision could not be recorded.");
        return;
      }
      setNote(
        next === "ACTIVE" ? `${member.displayName} is admitted.` : `${member.displayName} is denied.`,
      );
    } catch {
      setRows((rs) => rs.map((r) => (r.id === member.id ? { ...r, status: prev } : r)));
      setError("The decision could not be recorded.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="label-caps text-muted">
          {counts.active} active · {counts.pending} pending · {counts.denied} denied ·{" "}
          {counts.total} total
        </p>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name or email"
          type="search"
          className="w-full min-h-11 border border-gold-dim bg-ink-3 px-3 py-2 text-base text-ivory placeholder:text-muted/60 focus:border-gold focus:outline-none sm:max-w-xs"
        />
      </div>

      {error && (
        <p role="alert" className="border border-oxblood-bright/60 bg-oxblood/20 px-3 py-2 text-sm text-[#e0a3a3]">
          {error}
        </p>
      )}
      {note && (
        <p role="status" className="border border-gold-dim/50 bg-ink-3 px-3 py-2 text-sm text-gold-light">
          {note}
        </p>
      )}

      {filtered.length === 0 ? (
        <p className="accent-italic text-muted">No members match that.</p>
      ) : (
        <ul className="divide-y divide-gold-dim/30 border border-gold-dim/40 bg-ink-2">
          {filtered.map((m) => {
            const status = (LABEL[m.status as Status] ? m.status : "ACTIVE") as Status;
            const isSelf = m.id === selfId;
            const canApprove = status !== "ACTIVE";
            const canDeny = status !== "SUSPENDED" && !m.universalAdmin;
            const busy = busyId === m.id;
            return (
              <li
                key={m.id}
                className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5"
              >
                <div className="min-w-0">
                  <p className="label-caps text-ivory">
                    {m.displayName}
                    {m.isAdmin && <span className="ml-2 text-gold">· admin</span>}
                    {isSelf && <span className="ml-2 text-muted">· you</span>}
                  </p>
                  <p className="truncate text-sm text-muted">{m.email}</p>
                  <p className="label-caps mt-1 text-muted/80">
                    {m.campus} · {m.accessTier}
                    {m.creativeLevel ? ` / ${m.creativeLevel}` : ""}
                    {!m.identityVerified ? " · unverified" : ""}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
                  <span className={`label-caps border px-2 py-1.5 ${BADGE[status]}`}>
                    {LABEL[status]}
                  </span>
                  {!isSelf && canApprove && (
                    <button
                      type="button"
                      onClick={() => decide(m, "ACTIVE")}
                      disabled={busy}
                      className="label-caps touch-manipulation min-h-11 border border-gold px-4 py-2 text-ivory transition-colors hover:bg-oxblood/30 disabled:opacity-40"
                    >
                      Approve
                    </button>
                  )}
                  {!isSelf && canDeny && (
                    <button
                      type="button"
                      onClick={() => decide(m, "SUSPENDED")}
                      disabled={busy}
                      className="label-caps touch-manipulation min-h-11 border border-oxblood-bright px-4 py-2 text-[#e0a3a3] transition-colors hover:bg-oxblood/40 disabled:opacity-40"
                    >
                      Deny
                    </button>
                  )}
                  {!isSelf && m.universalAdmin && (
                    <span className="label-caps text-muted/70">universal admin</span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
