"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export function RetryJobButton({ disabled = false, jobId }: { disabled?: boolean; jobId: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <div className="space-y-2">
      <button
        className="inline-flex h-11 items-center justify-center rounded-2xl border border-zinc-300 px-4 text-sm font-medium text-zinc-900 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={disabled || isPending}
        onClick={() => {
          setError(null);
          startTransition(async () => {
            const response = await fetch(`/api/jobs/${jobId}/retry`, { method: "POST" });
            if (!response.ok) {
              const payload = (await response.json().catch(() => ({}))) as { error?: string };
              setError(payload.error ?? "Retry failed.");
              return;
            }

            router.refresh();
          });
        }}
        type="button"
      >
        {isPending ? "Retrying..." : "Retry From Failed Step"}
      </button>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
