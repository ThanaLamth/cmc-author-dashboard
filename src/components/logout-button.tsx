"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

export function LogoutButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function logout() {
    startTransition(async () => {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    });
  }

  return (
    <button
      className="inline-flex h-11 items-center justify-center rounded-2xl border border-[var(--border-strong)] bg-[var(--bg-panel)] px-4 text-sm font-medium text-[var(--text-primary)] transition hover:border-[var(--accent-primary)] hover:bg-[var(--bg-panel-soft)]"
      disabled={isPending}
      onClick={logout}
      type="button"
    >
      {isPending ? "Signing out..." : "Sign out"}
    </button>
  );
}
