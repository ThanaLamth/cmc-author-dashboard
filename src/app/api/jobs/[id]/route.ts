import { NextResponse } from "next/server";

import { getJobById } from "@/lib/jobs/queries";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const job = await getJobById(id);

  if (!job) {
    return NextResponse.json({ error: "Job not found." }, { status: 404 });
  }

  return NextResponse.json({
    job: {
      id: job.id,
      cmcUrl: job.cmcUrl,
      coinSlug: job.coinSlug,
      targetSite: job.targetSite,
      status: job.status,
      currentStage: job.currentStage,
      selectedArticle: job.selectedArticle
        ? {
            variantNo: job.selectedArticle.variantNo,
            bestAngle: job.selectedArticle.bestAngle,
            whyBest: job.selectedArticle.whyBest,
            banRiskSummary: job.selectedArticle.banRiskSummary,
          }
        : null,
      publishResult: job.publishResult
        ? {
            wordpressPostId: job.publishResult.wordpressPostId,
            wordpressUrl: job.publishResult.wordpressUrl,
            sheetRowId: job.publishResult.sheetRowId,
            telegramMessageId: job.publishResult.telegramMessageId,
          }
        : null,
      publishedPosts: job.publishedPosts.map((post) => ({
        variantNo: post.variantNo,
        publishOrder: post.publishOrder,
        wordpressPostId: post.wordpressPostId,
        wordpressUrl: post.wordpressUrl,
        publishStatus: post.publishStatus,
        scheduledAt: post.scheduledAt?.toISOString() ?? null,
        sheetRowId: post.sheetRowId,
      })),
      stageRuns: job.stageRuns.map((stageRun) => ({
        id: stageRun.id,
        stage: stageRun.stage,
        attempt: stageRun.attempt,
        status: stageRun.status,
        errorText: stageRun.errorMessage,
        startedAt: stageRun.startedAt?.toISOString() ?? null,
        finishedAt: stageRun.finishedAt?.toISOString() ?? null,
      })),
      variants: job.articleVariants.map((variant) => ({
        id: variant.id,
        variantNo: variant.variantNo,
        title: variant.title,
        body: variant.body,
        metaDescription: variant.metaDescription,
        thumbnailPrompt: variant.thumbnailPrompt,
      })),
    },
  });
}
