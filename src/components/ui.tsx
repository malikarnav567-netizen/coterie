import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { Sparkle } from "./brand";

/** Primary: oxblood fill, gold hairline, serif text, arrow. Never pill-shaped. */
export function PrimaryButton({
  children,
  className = "",
  ...rest
}: ComponentProps<"button">) {
  return (
    <button
      {...rest}
      className={`inline-flex items-center gap-2 border border-gold bg-oxblood px-5 py-2.5 font-[family-name:var(--font-display)] text-[15px] tracking-wide text-ivory transition-all duration-300 hover:border-gold-light hover:bg-oxblood-bright hover:shadow-[0_0_20px_rgba(201,164,92,0.15)] disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    >
      {children}
      <span aria-hidden="true">→</span>
    </button>
  );
}

export function SecondaryButton({
  children,
  className = "",
  ...rest
}: ComponentProps<"button">) {
  return (
    <button
      {...rest}
      className={`inline-flex items-center gap-2 border border-gold-dim bg-transparent px-5 py-2.5 font-[family-name:var(--font-display)] text-[15px] tracking-wide text-ivory transition-colors duration-300 hover:border-gold-light disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    >
      {children}
    </button>
  );
}

export function LinkButton({
  href,
  children,
  variant = "secondary",
  className = "",
}: {
  href: string;
  children: ReactNode;
  variant?: "primary" | "secondary";
  className?: string;
}) {
  const cls =
    variant === "primary"
      ? "inline-flex items-center gap-2 border border-gold bg-oxblood px-5 py-2.5 font-[family-name:var(--font-display)] text-[15px] tracking-wide text-ivory transition-all duration-300 hover:border-gold-light hover:bg-oxblood-bright hover:shadow-[0_0_20px_rgba(201,164,92,0.15)]"
      : "inline-flex items-center gap-2 border border-gold-dim bg-transparent px-5 py-2.5 font-[family-name:var(--font-display)] text-[15px] tracking-wide text-ivory transition-colors duration-300 hover:border-gold-light";
  return (
    <Link href={href} className={`${cls} ${className}`}>
      {children}
      {variant === "primary" && <span aria-hidden="true">→</span>}
    </Link>
  );
}

export function Input({
  label,
  error,
  className = "",
  ...rest
}: ComponentProps<"input"> & { label?: string; error?: string }) {
  return (
    <label className="block">
      {label && (
        <span className="label-caps mb-2 block text-muted">{label}</span>
      )}
      <input
        {...rest}
        className={`w-full border border-gold-dim bg-ink-3 px-3 py-2.5 font-[family-name:var(--font-body)] text-[16px] text-ivory italic placeholder:text-muted/60 focus:border-gold focus:outline-none ${error ? "border-oxblood-bright" : ""} ${className}`}
      />
      {error && <span className="mt-1.5 block text-sm text-[#d98a8a]">{error}</span>}
    </label>
  );
}

export function Textarea({
  label,
  error,
  className = "",
  ...rest
}: ComponentProps<"textarea"> & { label?: string; error?: string }) {
  return (
    <label className="block">
      {label && (
        <span className="label-caps mb-2 block text-muted">{label}</span>
      )}
      <textarea
        {...rest}
        className={`w-full border border-gold-dim bg-ink-3 px-3 py-2.5 font-[family-name:var(--font-body)] text-[16px] text-ivory placeholder:text-muted/60 focus:border-gold focus:outline-none ${error ? "border-oxblood-bright" : ""} ${className}`}
      />
      {error && <span className="mt-1.5 block text-sm text-[#d98a8a]">{error}</span>}
    </label>
  );
}

/** Tiny tracked-caps tag in a hairline border. Mentor variant is oxblood-filled. */
export function Tag({
  children,
  variant = "default",
}: {
  children: ReactNode;
  variant?: "default" | "mentor" | "gold";
}) {
  const cls =
    variant === "mentor"
      ? "border-oxblood-bright bg-oxblood text-gold-light"
      : variant === "gold"
        ? "border-gold text-gold"
        : "border-gold-dim text-muted";
  return (
    <span className={`label-caps inline-flex items-center border px-2 py-0.5 text-[10px] ${cls}`}>
      {children}
    </span>
  );
}

/** Thin double gold hairline inset from the edge, with corner flourishes. */
export function Frame({ children }: { children: ReactNode }) {
  return (
    <div className="pointer-events-none fixed inset-2 z-40 border border-gold-dim/70 max-md:hidden">
      <div className="absolute inset-[3px] border border-gold-dim/40">
        {["top-0 left-0", "top-0 right-0", "bottom-0 left-0", "bottom-0 right-0"].map((pos) => (
          <svg key={pos} width="14" height="14" viewBox="0 0 14 14" className={`absolute ${pos} m-[3px] text-gold`} fill="none" stroke="currentColor" strokeWidth="1">
            <path d="M1 13V4C1 2 2 1 4 1h9" strokeLinecap="round" />
            <circle cx="2.5" cy="2.5" r="0.9" fill="currentColor" stroke="none" />
          </svg>
        ))}
      </div>
      <span className="sr-only">Coterie</span>
      <Sparkle className="absolute -left-1 top-1/2 hidden text-gold/60" size={8} />
    </div>
  );
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="border border-gold-dim/50 bg-ink-2 px-8 py-14 text-center">
      <p className="accent-italic text-xl">{title}</p>
      {hint && <p className="mt-2 text-muted">{hint}</p>}
    </div>
  );
}
