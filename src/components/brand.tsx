/** Coterie brand primitives — inline SVG only, no raster assets, no hotlinks. */

export function Sparkle({ className = "", size = 14 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 0c.6 6.5 5.5 11.4 12 12-6.5.6-11.4 5.5-12 12-.6-6.5-5.5-11.4-12-12C6.5 11.4 11.4 6.5 12 0z" />
    </svg>
  );
}

export function Divider({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center gap-3 text-gold ${className}`} aria-hidden="true">
      <span className="h-px w-16 bg-gold-dim" />
      <Sparkle size={10} />
      <span className="h-px w-16 bg-gold-dim" />
    </div>
  );
}

export function WaxSeal({ level, size = 34 }: { level?: string | null; size?: number }) {
  const mentor = level === "MENTOR";
  const trusted = level === "TRUSTED" || level === "MENTOR_CANDIDATE";
  if (!mentor && !trusted && level !== "REVIEWER") return null;
  const fill = mentor ? "#8a2229" : "#5c1519";
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-label={`Wax seal: ${level ?? "reviewer"}`} role="img">
      {mentor && <circle cx="20" cy="20" r="18.5" fill="none" stroke="#c9a45c" strokeWidth="1" />}
      <circle cx="20" cy="20" r={mentor ? 16 : 17} fill={fill} stroke="#3f0e11" strokeWidth="1" />
      {/* laurel sprig, embossed */}
      <g stroke="#c9a45c" strokeWidth="1.1" fill="none" strokeLinecap="round">
        <path d="M14 25c2-6 5-9 12-11" />
        <path d="M17 21c1.5-.4 3-.3 4.2.4M19.5 17.5c1.5-.2 3 .2 4.2 1.1M22.5 14.7c1.3 0 2.6.5 3.6 1.5" />
      </g>
      <circle cx="20" cy="20" r="13.5" fill="none" stroke="#00000022" strokeWidth="1" />
    </svg>
  );
}

export function RomanNumeral({ value, className = "" }: { value: string; className?: string }) {
  return <span className={`display-caps text-gold ${className}`}>{value}</span>;
}

export function Laurel({ className = "", size = 90 }: { className?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1.25" className={className} aria-hidden="true">
      <path d="M78 14c-26 4-46 24-50 50" strokeLinecap="round" />
      <path d="M36 52c6-1 11 1 15 6M43 42c6-1 12 1 16 5M52 32c6-1 12 1 16 5M61 24c5-1 10 0 14 4" strokeLinecap="round" />
      <path d="M40 58c-3 4-8 6-13 6M46 48c-4 3-9 4-14 3M56 38c-4 3-9 4-13 3M66 30c-3 3-7 4-11 3" strokeLinecap="round" />
    </svg>
  );
}

export function GothicArch({ className = "", size = 80 }: { className?: string; size?: number }) {
  return (
    <svg width={size} height={size * 1.5} viewBox="0 0 80 120" fill="none" stroke="currentColor" strokeWidth="1.25" className={className} aria-hidden="true">
      <path d="M10 116V52C10 26 24 8 40 8s30 18 30 44v64" strokeLinecap="round" />
      <path d="M18 116V54c0-20 10-34 22-34s22 14 22 34v62" opacity="0.55" />
      <path d="M40 20v96M14 78h52" opacity="0.4" />
    </svg>
  );
}
