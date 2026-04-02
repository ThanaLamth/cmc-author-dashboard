import { JobDetailLive } from "@/components/job-detail-live";
import { getJobById } from "@/lib/jobs/queries";

type JobDetailPayload = {
  job?: {
    id: string;
    cmcUrl: string;
    coinSlug: string | null;
    targetSite: string;
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
        targetSite: dbJob.targetSite,
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

  return <JobDetailLive job={job} />;
}
