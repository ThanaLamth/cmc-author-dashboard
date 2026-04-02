"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { ArticleVariantCard } from "@/components/article-variant-card";
import { JobStageTimeline } from "@/components/job-stage-timeline";
import { LiveRefreshIndicator } from "@/components/live-refresh-indicator";
import { RetryJobButton } from "@/components/retry-job-button";
import { isActiveJobStatus } from "@/lib/jobs/activity";

function formatDateTime(value: string | null) {
  return value ? new Date(value).toLocaleString() : "-";
}

function formatQueueLabel(status: string, scheduledAt: string | null) {
  if (!scheduledAt) {
    return "Scheduled time pending";
  }

  return `Scheduled for ${formatDateTime(scheduledAt)}`;
}

type JobDetail = {
  id: string;
  cmcUrl: string;
  coinSlug: string | null;
  status: string;
  currentStage: string | null;
  publishResult: {
    wordpressUrl: string | null;
    sheetRowId: string | null;
    telegramMessageId: string | null;
  } | null;
  publishedPosts: Array<{
    variantNo: number;
    publishOrder: number;
    wordpressPostId: string | null;
    wordpressUrl: string | null;
    publishStatus: string;
    scheduledAt: string | null;
    sheetRowId: string | null;
  }>;
  selectedArticle: {
    variantNo: number;
    bestAngle: string | null;
    whyBest: string | null;
    banRiskSummary: string | null;
  } | null;
  stageRuns: Array<{
    id: string;
    stage: string;
    attempt: number;
    status: string;
    errorText: string | null;
    startedAt: string | null;
    finishedAt: string | null;
  }>;
  variants: Array<{
    id: string;
    variantNo: number;
    title: string;
    body: string;
    metaDescription: string | null;
    thumbnailPrompt: string | null;
  }>;
};

export function JobDetailLive({ job }: { job: JobDetail }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [lastUpdatedAt, setLastUpdatedAt] = useState(() => new Date().toISOString());
  const failed = job.status === "failed" || job.status === "partial_failed";
  const active = useMemo(() => isActiveJobStatus(job.status), [job.status]);
  const publicationByVariant = useMemo(
    () => new Map(job.publishedPosts.map((post) => [post.variantNo, post] as const)),
    [job.publishedPosts],
  );
  const publishedNow = job.publishedPosts.filter((post) => post.publishStatus === "publish").length;
  const scheduledCount = job.publishedPosts.filter((post) => post.publishStatus === "future").length;
  const queueLoggedCount = job.publishedPosts.filter((post) => post.sheetRowId).length;

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
        <section className="rounded-[2rem] border border-[var(--border-subtle)] bg-[linear-gradient(180deg,rgba(21,29,40,0.96),rgba(15,22,32,0.96))] p-6 shadow-[var(--shadow-panel)]">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="space-y-3">
              <div className="space-y-2">
                <p className="text-sm font-medium uppercase tracking-[0.24em] text-[var(--text-muted)]">
                  Job {job.id}
                </p>
                <h1 className="text-4xl font-semibold tracking-[-0.04em] text-[var(--text-primary)]">
                  {job.coinSlug ?? "Unknown coin"}
                </h1>
                <p className="text-sm text-[var(--text-secondary)]">{job.cmcUrl}</p>
                <p className="text-sm text-[var(--text-secondary)]">
                  Status: <span className="font-medium capitalize">{job.status}</span>
                  {" · "}
                  Stage: <span className="font-medium">{job.currentStage ?? "-"}</span>
                </p>
              </div>
              <LiveRefreshIndicator enabled={active} refreshing={isPending} updatedAt={lastUpdatedAt} />
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Link
                className="inline-flex h-11 items-center justify-center rounded-2xl border border-[var(--border-strong)] bg-[var(--bg-panel)] px-4 text-sm font-medium text-[var(--text-primary)] transition hover:border-[var(--accent-primary)] hover:bg-[var(--bg-panel-soft)]"
                href="/"
              >
                Back to Home
              </Link>
              <RetryJobButton disabled={!failed} jobId={job.id} />
            </div>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-4">
            <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-panel-soft)] p-4">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-[var(--text-muted)]">
                Variants
              </p>
              <p className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">{job.variants.length}</p>
            </div>
            <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-panel-soft)] p-4">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-[var(--text-muted)]">
                Live Now
              </p>
              <p className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">{publishedNow}</p>
            </div>
            <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-panel-soft)] p-4">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-[var(--text-muted)]">
                Scheduled
              </p>
              <p className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">{scheduledCount}</p>
            </div>
            <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-panel-soft)] p-4">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-[var(--text-muted)]">
                Sheet Rows
              </p>
              <p className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">{queueLoggedCount}</p>
            </div>
          </div>
        </section>

        <JobStageTimeline stages={job.stageRuns} />

        {job.selectedArticle ? (
          <section className="rounded-[2rem] border border-[var(--border-subtle)] bg-[rgba(21,29,40,0.9)] p-6 shadow-[var(--shadow-soft)]">
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">Selection Summary</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-panel-soft)] p-4">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-[var(--text-muted)]">
                  Best Angle
                </p>
                <p className="mt-2 text-sm text-[var(--text-secondary)]">{job.selectedArticle.bestAngle ?? "-"}</p>
              </div>
              <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-panel-soft)] p-4">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-[var(--text-muted)]">
                  Why Best
                </p>
                <p className="mt-2 text-sm text-[var(--text-secondary)]">{job.selectedArticle.whyBest ?? "-"}</p>
              </div>
              <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-panel-soft)] p-4">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-[var(--text-muted)]">
                  Ban Risk Check
                </p>
                <p className="mt-2 text-sm text-[var(--text-secondary)]">
                  {job.selectedArticle.banRiskSummary ?? "-"}
                </p>
              </div>
            </div>
          </section>
        ) : null}

        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Variants</h2>
          <div className="grid gap-4 xl:grid-cols-2">
            {job.variants.map((variant) => (
              <ArticleVariantCard
                key={variant.id}
                publication={publicationByVariant.get(variant.variantNo)}
                selected={variant.variantNo === job.selectedArticle?.variantNo}
                variant={variant}
              />
            ))}
          </div>
        </section>

        <section className="rounded-[2rem] border border-[var(--border-subtle)] bg-[rgba(21,29,40,0.9)] p-6 shadow-[var(--shadow-soft)]">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Publish Results</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-panel-soft)] p-4">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-[var(--text-muted)]">
                Queue Lead
              </p>
              {job.publishResult?.wordpressUrl ? (
                <a className="mt-2 block text-sm text-[var(--accent-primary)] underline underline-offset-4" href={job.publishResult.wordpressUrl}>
                  Open first scheduled post
                </a>
              ) : (
                <p className="mt-2 text-sm text-[var(--text-secondary)]">Queue not created yet.</p>
              )}
            </div>
            <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-panel-soft)] p-4">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-[var(--text-muted)]">
                Google Sheets
              </p>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">{job.publishResult?.sheetRowId ?? "-"}</p>
            </div>
            <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-panel-soft)] p-4">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-[var(--text-muted)]">
                Telegram
              </p>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">
                {job.publishResult?.telegramMessageId ?? "-"}
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] border border-[var(--border-subtle)] bg-[rgba(21,29,40,0.9)] p-6 shadow-[var(--shadow-soft)]">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Publication Queue</h2>
          <div className="mt-4 space-y-3">
            {job.publishedPosts.length ? (
              job.publishedPosts.map((post) => (
                <div
                  key={`${post.variantNo}-${post.publishOrder}`}
                  className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-panel-soft)] p-4 shadow-[var(--shadow-soft)]"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-[0.18em] text-[var(--text-muted)]">
                        Slot #{post.publishOrder + 1}
                      </p>
                      <p className="mt-1 text-base font-medium text-[var(--text-primary)]">
                        {job.variants.find((variant) => variant.variantNo === post.variantNo)?.title ??
                          `Variant ${post.variantNo}`}
                      </p>
                      <p className="mt-1 text-xs text-[var(--text-secondary)]">
                        Variant {post.variantNo} · {formatQueueLabel(post.publishStatus, post.scheduledAt)}
                      </p>
                    </div>
                    <span className="rounded-full bg-[rgba(255,255,255,0.06)] px-3 py-1 text-xs font-medium capitalize text-[var(--text-secondary)]">
                      {post.publishStatus}
                    </span>
                  </div>
                  {post.wordpressUrl ? (
                    <a className="mt-3 block text-sm text-[var(--accent-primary)] underline underline-offset-4" href={post.wordpressUrl}>
                      Open post
                    </a>
                  ) : null}
                  <div className="mt-3 grid gap-2 text-xs text-[var(--text-muted)] md:grid-cols-3">
                    <p>WordPress ID: {post.wordpressPostId ?? "-"}</p>
                    <p>Sheet row: {post.sheetRowId ?? "-"}</p>
                    <p>Scheduled: {formatDateTime(post.scheduledAt)}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-[var(--text-muted)]">No WordPress posts created yet.</p>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
