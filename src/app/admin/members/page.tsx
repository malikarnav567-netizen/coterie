import { listMembers } from "@/modules/identity/service";
import { getViewer } from "@/lib/session";
import { MembersTable } from "./members-table";

export const metadata = { title: "Members — Coterie" };

export default async function AdminMembersPage() {
  const [viewer, members] = await Promise.all([getViewer(), listMembers()]);
  const rows = members.map((m) => ({
    id: m.id,
    email: m.email,
    displayName: m.displayName,
    accessTier: m.accessTier,
    creativeLevel: m.creativeLevel,
    isAdmin: m.isAdmin,
    universalAdmin: m.universalAdmin,
    status: m.status,
    identityVerified: m.identityVerified,
    campus: m.campus?.name ?? "—",
    createdAt: m.createdAt.toISOString(),
  }));

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="display-caps text-2xl text-ivory">The roster</h1>
        <p className="accent-italic mt-1">
          Every new inbox waits below as Pending. Approve to open the door; deny to close it. A denied
          account keeps its work, but the door shuts on its next sign-in.
        </p>
      </div>
      <MembersTable members={rows} selfId={viewer?.id ?? ""} />
    </div>
  );
}
