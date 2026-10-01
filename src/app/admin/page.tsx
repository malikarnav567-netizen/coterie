import { pendingSamples } from "@/modules/samples/service";
import { AdminSampleCard } from "./sample-card";
import { EmptyState } from "@/components/ui";

export const metadata = { title: "Sample queue — Coterie" };

export default async function AdminSamplesPage() {
  const samples = await pendingSamples();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="display-caps text-2xl text-ivory">The committee's queue</h1>
        <p className="accent-italic mt-1">Acceptance is the only door to the critique room. Read closely.</p>
      </div>

      {samples.length === 0 ? (
        <EmptyState title="The queue is empty." hint="New submissions will wait here." />
      ) : (
        <div className="space-y-5">
          {samples.map((s) => (
            <AdminSampleCard
              key={s.id}
              sample={{
                id: s.id,
                form: s.form,
                body: s.body,
                attemptNo: s.attemptNo,
                status: s.status,
                createdAt: s.createdAt.toISOString(),
                authorName: s.user.displayName,
                authorEmail: s.user.email,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
