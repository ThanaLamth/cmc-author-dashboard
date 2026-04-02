"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { LiveRefreshIndicator } from "@/components/live-refresh-indicator";
import { JobsTable } from "@/components/jobs-table";
import { shouldPollJobs } from "@/lib/jobs/activity";

type JobRow = {
  id: string;
  cmcUrl: string;
  coinSlug: string | null;
  status: string;
  currentStage: string | null;
  createdAt: string;
  updatedAt: string;
};

export function JobsPageLive({ jobs }: { jobs: JobRow[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [lastUpdatedAt, setLastUpdatedAt] = useState(() => new Date().toISOString());
  const active = useMemo(() => shouldPollJobs(jobs.map((job) => job.status)), [jobs]);

  useEffect(() => {
    if (!active) {
      return;
    }

    const intervalId = window.setInterval(() => {
      startTransition(() => {
        router.refresh();
        setLastUpdatedAt(new Date().toISOString());
      });
    }, 5000);

    return () => window.clearInterval(intervalId);
  }, [active, router, startTransition]);

  return (
    <main className="min-h-screen px-6 py-16">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium uppercase tracking-[0.24em] text-[var(--text-muted)]">
              Jobs
            </p>
            <h1 className="text-4xl font-semibold tracking-[-0.04em] text-[var(--text-primary)]">
              Craft history
            </h1>
          </div>
          <LiveRefreshIndicator enabled={active} refreshing={isPending} updatedAt={lastUpdatedAt} />
        </div>
        <JobsTable jobs={jobs} />
      </div>
    </main>
  );
}
