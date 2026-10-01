"use client";

import { signOut } from "next-auth/react";

export function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/" })}
      className="label-caps border border-gold-dim/60 px-4 py-2 text-muted transition-colors hover:border-gold hover:text-ivory"
    >
      Leave the archive
    </button>
  );
}
