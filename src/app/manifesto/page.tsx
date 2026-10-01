import { Divider, Sparkle } from "@/components/brand";
import { LinkButton } from "@/components/ui";

export const metadata = { title: "Manifesto — Coterie" };

const TENETS = [
  {
    title: "The work is the witness",
    body: "We gather around writing, not around writers. Reviews critique the piece; the person stands outside the frame.",
  },
  {
    title: "Quality is the only currency",
    body: "Standing here is earned by the usefulness of what you give other writers — never by applause collected for your own.",
  },
  {
    title: "Show your work to join the room",
    body: "Every creative member began with a sample read by the admins. The door is effort, not acquaintance.",
  },
  {
    title: "Darkness is not a violation",
    body: "Difficult subjects belong in art. What we moderate is cruelty toward people — in the critique room and the commons alike.",
  },
  {
    title: "The commons stays small on purpose",
    body: "One campus. One discipline at a time, done properly. Better things await, but not before their season.",
  },
];

export default function ManifestoPage() {
  return (
    <div className="mx-auto max-w-2xl px-5 py-16">
      <div className="text-center">
        <Sparkle className="text-gold" size={12} />
        <h1 className="display-caps mt-4 text-3xl text-ivory md:text-4xl">Manifesto</h1>
        <p className="accent-italic mt-2 text-lg">Coterie Lux Mea</p>
      </div>
      <Divider className="my-10" />
      <div className="space-y-10">
        {TENETS.map((t, i) => (
          <section key={t.title} className="reveal" style={{ animationDelay: `${i * 60}ms` }}>
            <h2 className="display-caps text-lg text-gold-light">{t.title}</h2>
            <p className="mt-2 leading-relaxed text-ivory/85">{t.body}</p>
          </section>
        ))}
      </div>
      <div className="mt-14 text-center">
        <LinkButton href="/enter" variant="primary">
          Enter the Archive
        </LinkButton>
      </div>
    </div>
  );
}
