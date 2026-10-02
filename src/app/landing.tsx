"use client";

/**
 * COTERIE landing — rebuilt around the supplied PNG artwork (public/ref-assets).
 * Art is used as-is: card blanks and the banner are backgrounds with real HTML
 * text overlaid in their lower halves; the *-with-text.png files are never used.
 * Palette: page #090806, headline #fdfcf4 / italic gold #fce3b6, rules #c0a87c,
 * primary button #350b0c with a gold border.
 */

import { Menu, X } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";

const navLinks = [
  { label: "The Commons", href: "#commons" },
  { label: "Creatives", href: "#create" },
  { label: "Workshops", href: "#critique" },
  { label: "Collaborate", href: "#collaborate" },
] as const;

const cards = [
  {
    id: "create",
    title: "Create",
    copy: "Post your work to a campus that actually reads.",
    tags: ["Writing", "Music", "Film", "Art", "Photography", "More"],
    image: "/ref-assets/card-create-blank.png",
    width: 508,
  },
  {
    id: "critique",
    title: "Critique",
    copy: "Receive thoughtful ratings and structured review.",
    tags: ["Honest Feedback", "Growth", "Constructive", "Kind"],
    image: "/ref-assets/card-critique-blank.png",
    width: 500,
  },
  {
    id: "collaborate",
    title: "Collaborate",
    copy: "Find the people who make your next idea possible.",
    tags: ["Groups", "Projects", "Events", "Real Connections"],
    image: "/ref-assets/card-collaborate-blank.png",
    width: 504,
  },
] as const;

const steps = [
  { icon: "/ref-assets/icon-book.png", size: 138, title: "Student", copy: "Share your work. Find your people." },
  { icon: "/ref-assets/icon-quill.png", size: 136, title: "Creative", copy: "Refine your craft. Build your voice." },
  { icon: "/ref-assets/icon-laurel.png", size: 138, title: "Mentor", copy: "Give back. Lift others." },
] as const;

/** Thin arrow used between the banner steps; rotates downward on mobile. */
function StepArrow() {
  return (
    <span
      aria-hidden="true"
      className="flex rotate-90 items-center text-lux-ink/55 wide:rotate-0 wide:self-center"
    >
      <span className="h-px w-7 bg-current" />
      <span className="-ml-[3px] mt-[1px] size-1.5 rotate-45 border-r border-t border-current" />
    </span>
  );
}

export function Landing() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="relative min-h-screen bg-lux-bg text-lux-ivory">
      {/* Thin gold frame inset around the whole page, with mirrored corner artwork. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-2 z-40 border border-lux-gold/70 sm:inset-3">
        <Image src="/ref-assets/corner-frame.png" alt="" width={160} height={160} priority className="absolute left-0 top-0 w-12 sm:w-14" />
        <Image src="/ref-assets/corner-frame.png" alt="" width={160} height={160} priority className="absolute right-0 top-0 w-12 -scale-x-100 sm:w-14" />
        <Image src="/ref-assets/corner-frame.png" alt="" width={160} height={160} priority className="absolute bottom-0 left-0 w-12 -scale-y-100 sm:w-14" />
        <Image src="/ref-assets/corner-frame.png" alt="" width={160} height={160} priority className="absolute bottom-0 right-0 w-12 -scale-x-100 -scale-y-100 sm:w-14" />
      </div>

      {/* Padding (not margin) so the header offset can't collapse through and
          drag the gold frame down with the content. */}
      <div className="relative pt-14 wide:pt-16">
        {/* ── 1 · Nav ─────────────────────────────────────────────────── */}
        <header className="mx-6 border-b border-lux-gold/70 pb-5 sm:mx-10 wide:mx-24">
          <div className="flex items-center gap-5">
            <a href="#top" className="flex items-center gap-3" aria-label="Coterie home">
              <span aria-hidden="true" className="text-xl text-lux-gold">✦</span>
              <span className="display-caps text-2xl text-lux-ivory sm:text-[1.7rem]">Coterie</span>
            </a>

            <nav className="ml-auto hidden items-center gap-9 whitespace-nowrap wide:flex" aria-label="Primary">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="label-caps text-[0.6rem] text-parchment-muted transition-colors duration-300 hover:text-lux-gold-soft"
                >
                  {link.label}
                </a>
              ))}
            </nav>

            <div className="ml-auto flex items-center gap-4 wide:ml-10">
              <Link
                href="/enter"
                className="label-caps hidden min-h-11 touch-manipulation items-center gap-2 border border-lux-gold/70 px-5 py-2.5 text-[0.6rem] text-lux-ivory transition-colors duration-300 hover:bg-lux-gold/10 sm:inline-flex"
              >
                Enter the Archive <span aria-hidden="true">→</span>
              </Link>
              <button
                type="button"
                className="grid size-11 touch-manipulation place-items-center text-lux-gold wide:hidden"
                onClick={() => setMenuOpen((open) => !open)}
                aria-label={menuOpen ? "Close menu" : "Open menu"}
                aria-expanded={menuOpen}
              >
                {menuOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
            </div>
          </div>

          {menuOpen && (
            <nav className="mt-5 flex flex-col border-t border-lux-gold/40 pt-3 wide:hidden" aria-label="Mobile">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="label-caps flex min-h-11 touch-manipulation items-center border-b border-lux-gold/20 py-3.5 text-[0.7rem] text-parchment-muted transition-colors duration-300 hover:text-lux-gold-soft"
                  onClick={() => setMenuOpen(false)}
                >
                  {link.label}
                </a>
              ))}
              <Link
                href="/enter"
                className="label-caps mt-5 inline-flex min-h-11 touch-manipulation items-center justify-center gap-2 border border-lux-gold/70 px-5 py-3 text-[0.62rem] text-lux-ivory transition-colors duration-300 hover:bg-lux-gold/10"
                onClick={() => setMenuOpen(false)}
              >
                Enter the Archive <span aria-hidden="true">→</span>
              </Link>
            </nav>
          )}
        </header>

        {/* ── 2 · Hero ────────────────────────────────────────────────── */}
        <section id="top" className="relative mx-5 mt-12 sm:mx-9 wide:mx-16">
          <div className="grid gap-10 wide:grid-cols-[minmax(0,1fr)_auto] wide:gap-6">
            <div className="pt-1">
              <p aria-hidden="true" className="label-caps text-[0.55rem] leading-[2] text-lux-gold">
                Coterie<br />Lux<br />Mea<br />
                <span className="mt-1 block text-sm">✦</span>
                <span className="mt-1 block h-8 border-l border-lux-gold/60" />
              </p>

              <h1 className="mt-6 font-[family-name:var(--font-display)] text-[clamp(2.4rem,6.6vw,5.2rem)] uppercase leading-[0.95] tracking-[0.05em] text-lux-ivory">
                Make something
                <em className="mt-1 block font-[family-name:var(--font-body)] font-normal normal-case italic text-lux-gold-soft">
                  worth remembering
                </em>
              </h1>

              <p className="mt-7 max-w-xl font-[family-name:var(--font-body)] text-lg leading-7 text-parchment-muted sm:text-xl sm:leading-8">
                A private creative commons for writers, musicians, filmmakers, visual artists, and makers — built around your campus.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Link
                  href="/enter"
                  className="label-caps inline-flex min-h-11 items-center gap-2 border border-lux-gold/80 bg-lux-seal px-7 py-3 text-[0.62rem] text-lux-ivory transition-colors duration-300 hover:bg-lux-seal-bright"
                >
                  Enter the Commons <span aria-hidden="true">→</span>
                </Link>
                <Link
                  href="/manifesto"
                  className="label-caps inline-flex min-h-11 items-center border border-lux-gold/70 px-7 py-3 text-[0.62rem] text-lux-ivory transition-colors duration-300 hover:bg-lux-gold/10"
                >
                  Read the Manifesto
                </Link>
              </div>
            </div>

            <div className="relative hidden justify-self-end wide:block">
              <Image
                src="/ref-assets/gold-branch-arc.png"
                alt="Gilded branch arcing across a full moon"
                width={460}
                height={760}
                priority
                className="w-[330px] wide:w-[400px]"
              />
            </div>
          </div>

          {/* Bottom strip: castle + est. line (left), volume mark (right). */}
          <div className="mt-12 flex items-end justify-between gap-6 pb-12">
            <div>
              <Image src="/ref-assets/castle.png" alt="" width={420} height={196} loading="lazy" className="w-44 opacity-90 sm:w-60" />
              <div className="mt-2 flex items-center gap-3">
                <span className="label-caps text-[0.55rem] text-lux-gold">Est. MMXXVI</span>
                <span aria-hidden="true" className="h-px w-24 bg-lux-gold/60 sm:w-36" />
              </div>
            </div>

            <div className="hidden items-start gap-4 sm:flex">
              <p className="font-[family-name:var(--font-body)] text-base italic leading-5 text-lux-gold-soft">
                Better<br />Things<br />await.
                <span className="label-caps mt-3 block text-[0.5rem] not-italic text-lux-gold/90">Vol. I</span>
              </p>
              <span aria-hidden="true" className="mt-1 h-24 border-l border-lux-gold/60" />
            </div>
          </div>
        </section>

        {/* ── 3 · A space to — Share. Read. Build. ───────────────────── */}
        <section id="commons" className="relative mx-5 border-t border-lux-gold/50 py-16 sm:mx-9 wide:mx-16 wide:py-20">
          <div className="text-center">
            <div className="section-kicker"><span />A space to<span /></div>
            <h2 className="mt-4 font-[family-name:var(--font-body)] text-5xl italic text-lux-ivory sm:text-6xl">Share. Read. Build.</h2>
          </div>

          <div className="space-layout mx-auto mt-14 max-w-[1340px]">
            {/* Decorative left column (hidden on small screens) */}
            <aside className="space-aside" aria-hidden="true">
              <Image src="/ref-assets/gothic-window.png" alt="" width={160} height={300} loading="lazy" className="w-14 opacity-90" />
              <span className="text-base text-lux-gold">✦</span>
              <p className="font-[family-name:var(--font-body)] text-sm italic leading-6 text-lux-gold-soft">Not<br />all who<br />wander<br />are lost.</p>
              <span className="text-base text-lux-gold">✦</span>
            </aside>

            {/* ── 4 · Cards ─────────────────────────────────────────── */}
            {/* Three-up once the desktop composition starts; below that the cards
                stack, and the overlay type scales in container units so the fit
                stays identical at any card width. */}
            <div className="grid gap-6 wide:grid-cols-3">
              {cards.map((card) => (
                <article key={card.id} id={card.id} className="lux-card relative aspect-[0.71] overflow-hidden">
                  <Image
                    src={card.image}
                    alt=""
                    width={card.width}
                    height={712}
                    loading="lazy"
                    aria-hidden="true"
                    className="absolute inset-0 h-full w-full object-fill"
                  />
                  {/* Overlay text confined to the lower half (never covers the
                      illustration); its scale rides the card width via cqw. */}
                  <div className="lux-card-body absolute inset-x-0 bottom-0 top-1/2 flex flex-col items-center justify-end text-center text-lux-ink">
                    <h3 className="lux-card-title font-[family-name:var(--font-body)] font-medium uppercase leading-none">
                      {card.title}
                    </h3>
                    <span className="lux-card-rule flex items-center gap-2" aria-hidden="true">
                      <span className="h-px bg-lux-ink/35" />✦<span className="h-px bg-lux-ink/35" />
                    </span>
                    <p className="lux-card-copy font-[family-name:var(--font-body)]">{card.copy}</p>
                    <p className="lux-card-tags text-lux-ink/75">
                      {card.tags.map((tag, i) => (
                        <span key={tag}>
                          {tag}
                          {i < card.tags.length - 1 && (
                            <>
                              {"\u00A0"}
                              <span className="px-1 opacity-60">/</span>{" "}
                            </>
                          )}
                        </span>
                      ))}
                    </p>
                  </div>
                </article>
              ))}
            </div>

            {/* Decorative right column (hidden on small screens) */}
            <aside className="space-aside" aria-hidden="true">
              <Image src="/ref-assets/ornament-star-stem.png" alt="" width={140} height={290} loading="lazy" className="w-12 opacity-90" />
              <p className="label-caps text-[0.52rem] leading-[2.1] text-lux-gold">Art<br />Builds<br />Bridges</p>
              <Image src="/ref-assets/plant-sprig.png" alt="" width={140} height={190} loading="lazy" className="w-12 opacity-90" />
            </aside>
          </div>
        </section>

        {/* ── 5 · Banner ──────────────────────────────────────────────── */}
        <section id="manifesto" className="relative mx-3 mb-16 sm:mx-5 wide:mx-8">
          <Image
            src="/ref-assets/banner-blank.png"
            alt=""
            width={1910}
            height={510}
            loading="lazy"
            aria-hidden="true"
            className="absolute inset-0 hidden h-full w-full object-cover wide:block"
          />
          <div className="lux-banner relative z-10 flex flex-col gap-10 px-8 py-14 text-lux-ink sm:px-12 sm:py-16 wide:grid wide:grid-cols-[minmax(0,0.92fr)_minmax(0,1.4fr)] wide:items-center wide:gap-8 wide:py-14 wide:pl-[22%] wide:pr-[4%]">
            <div className="max-w-md">
              <h2 className="display-caps text-[clamp(1.5rem,2.6vw,2.1rem)] leading-tight">
                Grow through<br />what you give.
              </h2>
              <span className="my-4 flex items-center gap-2 text-[0.55rem]" aria-hidden="true">
                <span className="h-px w-11 bg-lux-ink/35" />✦
              </span>
              <p className="max-w-sm font-[family-name:var(--font-body)] text-[1rem] leading-6">
                Your work means something. Here, it doesn’t just get seen — it gets better. Through thoughtful feedback,
                real collaboration, and a community that believes in the power of creative people.
              </p>
            </div>

            <ol className="mt-2 flex flex-col items-center gap-7 wide:mt-0 wide:flex-row wide:items-center wide:justify-between wide:gap-2">
              {steps.map((step, index) => (
                <li key={step.title} className="flex flex-col items-center gap-7 wide:contents">
                  <div className="flex w-full max-w-56 flex-col items-center text-center wide:w-36">
                    <Image src={step.icon} alt="" width={step.size} height={step.size} loading="lazy" className="w-14" />
                    <h3 className="label-caps mt-3 text-[0.6rem]">{step.title}</h3>
                    <p className="mt-1.5 max-w-[10rem] font-[family-name:var(--font-body)] text-sm italic leading-5">{step.copy}</p>
                  </div>
                  {index < steps.length - 1 && <StepArrow />}
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ── 6 · Footer ──────────────────────────────────────────────── */}
        <footer className="mx-6 pb-14 sm:mx-10 wide:mx-24">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:gap-6">
            <span className="label-caps text-[0.55rem] text-lux-gold">Coterie / Est. MMXXVI</span>
            <span aria-hidden="true" className="hidden h-px min-w-16 flex-1 bg-lux-gold/50 sm:block" />
            <span className="flex items-center gap-3">
              <span className="font-[family-name:var(--font-body)] text-base italic text-lux-gold-soft">Ideas. People. Progress.</span>
              <span aria-hidden="true" className="text-sm text-lux-gold">✦</span>
            </span>
          </div>
          <Image src="/ref-assets/footer-flourish.png" alt="" width={170} height={74} loading="lazy" className="mx-auto mt-10 w-24 opacity-90" />
        </footer>
      </div>
    </div>
  );
}
