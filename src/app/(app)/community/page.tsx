import { getViewer } from "@/lib/session";
import { canAccessCommunity, listCommunity } from "@/modules/community/service";
import { GothicArch } from "@/components/brand";
import { LinkButton } from "@/components/ui";
import { CommunityComposer, FlagButton } from "./community-client";

export const metadata = { title: "Community — Coterie" };

export default async function CommunityPage() {
  const viewer = await getViewer();
  if (!viewer) return null;
  if (!(await canAccessCommunity(viewer))) {
    return (
      <div className="mx-auto max-w-xl py-16 text-center">
        <GothicArch className="mx-auto text-gold/30" size={90} />
        <h1 className="display-caps mt-6 text-2xl text-ivory">The Commons, after hours</h1>
        <p className="accent-italic mt-2">This room opens to creatives. Earn your seat to enter.</p>
        <div className="mt-8 flex justify-center">
          <LinkButton href="/sample" variant="primary">Earn your seat</LinkButton>
        </div>
      </div>
    );
  }

  const posts = await listCommunity(viewer);

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div className="text-center">
        <h1 className="display-caps text-2xl text-ivory md:text-3xl">The Commons, after hours</h1>
        <p className="accent-italic mt-1">A looser room. Confessions arrive without a name.</p>
        <p className="label-caps mt-3 text-muted">Flagged only when hateful — dark subjects are not violations.</p>
      </div>

      <CommunityComposer />

      <div className="space-y-5">
        {posts.length === 0 && (
          <p className="border border-gold-dim/40 bg-ink-2 px-6 py-8 text-center text-muted">
            Nothing here yet. Be the first to write.
          </p>
        )}
        {posts.map((p) => (
          <div key={p.id} className="border border-gold-dim/30 bg-ink-2/60 px-6 py-5">
            <div className="flex items-center justify-between gap-3">
              <p className="label-caps text-gold/80">
                {p.kind === "CONFESSION" ? "A voice in the dark" : p.authorName}
                <span className="ml-2 text-muted/70">{p.kind.toLowerCase()}</span>
              </p>
              <FlagButton targetType="COMMUNITY_POST" targetId={p.id} />
            </div>
            <p className="mt-3 whitespace-pre-wrap text-[15px] leading-relaxed text-ivory/85">{p.body}</p>
            {p.comments.length > 0 && (
              <div className="mt-4 space-y-3 border-l border-gold-dim/30 pl-4">
                {p.comments.map((c) => (
                  <div key={c.id}>
                    <p className="label-caps text-muted">{c.authorName}</p>
                    <p className="mt-0.5 text-sm text-ivory/80">{c.body}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
