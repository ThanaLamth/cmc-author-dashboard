import { ArticleVariantCard } from "@/components/article-variant-card";
import { JobStageTimeline } from "@/components/job-stage-timeline";
import { RetryJobButton } from "@/components/retry-job-button";
import { getJobById } from "@/lib/jobs/queries";

type JobDetailPayload = {
  job?: {
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
};

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const dbJob = await getJobById(id);

  const job = dbJob
    ? ({
        id: dbJob.id,
        cmcUrl: dbJob.cmcUrl,
        coinSlug: dbJob.coinSlug,
        status: dbJob.status,
        currentStage: dbJob.currentStage,
        selectedArticle: dbJob.selectedArticle
          ? {
              variantNo: dbJob.selectedArticle.variantNo,
              bestAngle: dbJob.selectedArticle.bestAngle,
              whyBest: dbJob.selectedArticle.whyBest,
              banRiskSummary: dbJob.selectedArticle.banRiskSummary,
            }
          : null,
        publishResult: dbJob.publishResult
          ? {
              wordpressUrl: dbJob.publishResult.wordpressUrl,
              sheetRowId: dbJob.publishResult.sheetRowId,
              telegramMessageId: dbJob.publishResult.telegramMessageId,
            }
          : null,
        publishedPosts: dbJob.publishedPosts.map((post) => ({
          variantNo: post.variantNo,
          publishOrder: post.publishOrder,
          wordpressPostId: post.wordpressPostId,
          wordpressUrl: post.wordpressUrl,
          publishStatus: post.publishStatus,
          scheduledAt: post.scheduledAt?.toISOString() ?? null,
          sheetRowId: post.sheetRowId,
        })),
        stageRuns: dbJob.stageRuns.map((stageRun) => ({
          id: stageRun.id,
          stage: stageRun.stage,
          attempt: stageRun.attempt,
          status: stageRun.status,
          errorText: stageRun.errorMessage,
          startedAt: stageRun.startedAt?.toISOString() ?? null,
          finishedAt: stageRun.finishedAt?.toISOString() ?? null,
        })),
        variants: dbJob.articleVariants.map((variant) => ({
          id: variant.id,
          variantNo: variant.variantNo,
          title: variant.title,
          body: variant.body,
          metaDescription: variant.metaDescription,
          thumbnailPrompt: variant.thumbnailPrompt,
        })),
      } satisfies NonNullable<JobDetailPayload["job"]>)
    : null;

  if (!job) {
    return (
      <main className="min-h-screen bg-zinc-100 px-6 py-16">
        <div className="mx-auto max-w-4xl rounded-3xl border border-black/10 bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-semibold text-zinc-950">Job not found</h1>
        </div>
      </main>
    );
  }

  const failed = job.status === "failed" || job.status === "partial_failed";

  return (
    <main className="min-h-screen bg-zinc-100 px-6 py-16">
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="space-y-2">
              <p className="text-sm font-medium uppercase tracking-[0.24em] text-zinc-500">
                Job {job.id}
              </p>
              <h1 className="text-3xl font-semibold tracking-tight text-zinc-950">
                {job.coinSlug ?? "Unknown coin"}
              </h1>
              <p className="text-sm text-zinc-600">{job.cmcUrl}</p>
              <p className="text-sm text-zinc-700">
                Status: <span className="font-medium capitalize">{job.status}</span>
                {" · "}
                Stage: <span className="font-medium">{job.currentStage ?? "-"}</span>
              </p>
            </div>
            <RetryJobButton disabled={!failed} jobId={job.id} />
          </div>
        </section>

        <JobStageTimeline stages={job.stageRuns} />

        {job.selectedArticle ? (
          <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-zinc-950">Selection Summary</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl bg-zinc-50 p-4">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">
                  Best Angle
                </p>
                <p className="mt-2 text-sm text-zinc-800">{job.selectedArticle.bestAngle ?? "-"}</p>
              </div>
              <div className="rounded-2xl bg-zinc-50 p-4">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">
                  Why Best
                </p>
                <p className="mt-2 text-sm text-zinc-800">{job.selectedArticle.whyBest ?? "-"}</p>
              </div>
              <div className="rounded-2xl bg-zinc-50 p-4">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">
                  Ban Risk Check
                </p>
                <p className="mt-2 text-sm text-zinc-800">
                  {job.selectedArticle.banRiskSummary ?? "-"}
                </p>
              </div>
            </div>
          </section>
        ) : null}

        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-zinc-950">Variants</h2>
          <div className="grid gap-4 lg:grid-cols-3">
            {job.variants.map((variant) => (
              <ArticleVariantCard
                key={variant.id}
                selected={variant.variantNo === job.selectedArticle?.variantNo}
                variant={variant}
              />
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-zinc-950">Publish Results</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl bg-zinc-50 p-4">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">
                Primary WordPress Post
              </p>
              {job.publishResult?.wordpressUrl ? (
                <a className="mt-2 block text-sm text-zinc-900 underline" href={job.publishResult.wordpressUrl}>
                  Open published post
                </a>
              ) : (
                <p className="mt-2 text-sm text-zinc-600">Not published yet.</p>
              )}
            </div>
            <div className="rounded-2xl bg-zinc-50 p-4">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">
                Google Sheets
              </p>
              <p className="mt-2 text-sm text-zinc-800">{job.publishResult?.sheetRowId ?? "-"}</p>
            </div>
            <div className="rounded-2xl bg-zinc-50 p-4">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">
                Telegram
              </p>
              <p className="mt-2 text-sm text-zinc-800">
                {job.publishResult?.telegramMessageId ?? "-"}
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-zinc-950">Publication Queue</h2>
          <div className="mt-4 space-y-3">
            {job.publishedPosts.length ? (
              job.publishedPosts.map((post) => (
                <div
                  key={`${post.variantNo}-${post.publishOrder}`}
                  className="rounded-2xl border border-black/10 bg-zinc-50 p-4"
                >
                  <p className="text-sm font-medium text-zinc-900">
                    Variant {post.variantNo} · {post.publishStatus}
                  </p>
                  <p className="mt-1 text-xs text-zinc-600">
                    {post.scheduledAt ? `Scheduled at ${post.scheduledAt}` : "Published immediately"}
                  </p>
                  {post.wordpressUrl ? (
                    <a className="mt-2 block text-sm text-zinc-900 underline" href={post.wordpressUrl}>
                      Open post
                    </a>
                  ) : null}
                  <p className="mt-2 text-xs text-zinc-600">Sheet row: {post.sheetRowId ?? "-"}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-zinc-600">No WordPress posts created yet.</p>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
