import { mentorCandidates, candidateReviewSample, spotCheckCandidates } from "@/modules/progression/service";
import { EmptyState } from "@/components/ui";
import { CandidateCard } from "./candidate-card";

export const metadata = { title: "Mentor candidates — Coterie" };

export default async function AdminMentorPage() {
  const candidates = await mentorCandidates();
  const spotChecks = await spotCheckCandidates();

  const samples = await Promise.all(
    candidates.map(async (c) => ({
      candidateId: c.candidateId,
      reviews: await candidateReviewSample(c.candidateId, 3),
    })),
  );
  const sampleMap = new Map(samples.map((s) => [s.candidateId, s.reviews]));

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="display-caps text-2xl text-ivory">Mentor candidates</h1>
        <p className="accent-italic mt-1">
          Mentor is given only after the admins read a sample of the candidate's reviews.
        </p>
      </div>

      {candidates.length === 0 ? (
        <EmptyState title="No candidates await." hint="The ladder will send them here when the threshold is met." />
      ) : (
        <div className="space-y-6">
          {candidates.map((c) => (
            <CandidateCard
              key={c.id}
              candidate={{
                noteId: c.id,
                candidateId: c.candidateId,
                name: c.candidate.displayName,
                email: c.candidate.email,
                reviews: (sampleMap.get(c.candidateId) ?? []).map((r) => ({
                  id: r.id,
                  title: r.post.title,
                  whatWorked: r.whatWorked,
                  whatDidNot: r.whatDidNot,
                  oneSuggestion: r.oneSuggestion,
                  verdict: r.rating?.verdict ?? null,
                })),
              }}
            />
          ))}
        </div>
      )}

      {spotChecks.length > 0 && (
        <section className="border border-gold-dim/40 bg-ink-2 px-6 py-5">
          <h2 className="label-caps text-gold">Spot-check list</h2>
          <p className="mt-1 text-sm text-muted">Members near the mentor threshold, for a quiet look at their ratings.</p>
          <ul className="mt-3 space-y-1">
            {spotChecks.map((s) => (
              <li key={s.userId} className="text-sm text-ivory/85">
                {s.user.displayName} — useful {s.usefulCount}, distinct writers {s.distinctUsefulRaters}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
