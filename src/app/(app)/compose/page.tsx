import { redirect } from "next/navigation";
import { getViewer } from "@/lib/session";
import { GENRES } from "@/lib/enums";
import { ComposeForm } from "./compose-form";

export const metadata = { title: "New piece — Coterie" };

export default async function ComposePage() {
  const viewer = await getViewer();
  if (!viewer) redirect("/enter?next=/compose");
  if (viewer.accessTier !== "CREATIVE") redirect("/sample?reason=creatives_only");

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="display-caps text-2xl text-ivory md:text-3xl">New piece</h1>
      <p className="accent-italic mt-1">Set the page down where others can read it.</p>
      <ComposeForm genres={[...GENRES]} />
    </div>
  );
}
