import { redirect } from "next/navigation";
import { getViewer } from "@/lib/session";
import { mySamples } from "@/modules/samples/service";
import { getConfigNumber } from "@/modules/config/service";
import { countWords } from "@/lib/text";
import { SampleForm } from "./sample-form";
import { Divider } from "@/components/brand";

export const metadata = { title: "Submit a sample — Coterie" };

const STEPS = ["SUBMITTED", "IN_REVIEW", "ACCEPTED"] as const;

export default async function SamplePage() {
  const viewer = await getViewer();
  if (!viewer) redirect("/enter?next=/sample");
  const samples = await mySamples(viewer.id);
  const maxWords = await getConfigNumber("sample_max_words");
  const latest = samples[0];

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="display-caps text-2xl text-ivory md:text-3xl">Earn your seat</h1>
      <p className="accent-italic mt-1">
        Creatives are accepted by sample. The admins read every submission.
      </p>

      {latest && (
        <div className="mt-8 border border-gold-dim/50 bg-ink-2 p-6">
          <h2 className="label-caps text-gold">Your latest sample</h2>
          <p className="mt-2 text-sm text-muted">
            Attempt {latest.attemptNo} · {latest.form.toLowerCase()} · submitted{" "}
            {latest.createdAt.toLocaleDateString()}
          </p>
          <ol className="mt-4 flex items-center gap-2" aria-label="Sample status">
            {STEPS.map((s, i) => {
              const reached =
                s === "ACCEPTED" ? latest.status === "ACCEPTED" : true;
              const current =
                (latest.status === "SUBMITTED" && s === "SUBMITTED") ||
                (latest.status === "IN_REVIEW" && s === "IN_REVIEW") ||
                (latest.status === "ACCEPTED" && s === "ACCEPTED");
              return (
                <li key={s} className="flex items-center gap-2">
                  <span
                    className={`label-caps border px-2 py-1 ${
                      current
                        ? "border-gold text-gold"
                        : reached
                          ? "border-gold-dim/60 text-muted"
                          : "border-gold-dim/30 text-muted/40"
                    }`}
                  >
                    {s === "SUBMITTED" ? "Submitted" : s === "IN_REVIEW" ? "In review" : "Accepted"}
                  </span>
                  {i < STEPS.length - 1 && <span aria-hidden="true" className="text-gold-dim">—</span>}
                </li>
              );
            })}
          </ol>
          {latest.status === "REJECTED" && (
            <div className="mt-4 border-l-2 border-oxblood-bright pl-4">
              <p className="label-caps text-[#d98a8a]">Not this time</p>
              {latest.feedbackText && (
                <p className="mt-1 text-[15px] text-ivory/85">{latest.feedbackText}</p>
              )}
              <p className="mt-1 text-sm text-muted">You may try again — revision is the whole craft.</p>
            </div>
          )}
        </div>
      )}

      {latest?.status === "ACCEPTED" ? (
        <p className="mt-8 border border-gold/50 bg-ink-2 px-6 py-5 text-center">
          <span className="accent-italic text-lg">Your seat is earned. Welcome to the critique room.</span>
        </p>
      ) : (
        <>
          <Divider className="my-8" />
          <SampleForm maxWords={maxWords} locked={latest?.status === "SUBMITTED" || latest?.status === "IN_REVIEW"} />
        </>
      )}
    </div>
  );
}
