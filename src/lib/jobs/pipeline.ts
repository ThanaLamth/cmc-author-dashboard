import { db } from "@/lib/db";
import { craftFromCoinPage } from "@/lib/integrations/top-cmc-writer";
import { appendGoogleSheetsLog } from "@/lib/integrations/google-sheets";
import { sendTelegramNotification } from "@/lib/integrations/telegram";
import { createWordPressDraft } from "@/lib/integrations/wordpress";
import { JOB_STAGES, type JobStage } from "@/lib/jobs/constants";
import { runStage } from "@/lib/jobs/stage-runner";

type PipelineSelectedVariant = {
  body: string;
  metaDescription: string | null;
  sourceCount: number;
  thumbnailPrompt: string | null;
  title: string;
  variantNo: number;
};

const stageOrder: JobStage[] = [...JOB_STAGES];

function getStartIndex(currentStage: string | null) {
  if (!currentStage) {
    return 0;
  }

  const index = stageOrder.findIndex((stage) => stage === currentStage);
  return index === -1 ? 0 : index;
}

async function loadPersistedContext(jobId: string) {
  const [selectedArticle, publishRecord] = await Promise.all([
    db.selectedArticle.findUnique({
      where: { jobId },
      include: {
        articleVariant: true,
      },
    }),
    db.publishResult.findUnique({
      where: { jobId },
    }),
  ]);

  return {
    publishResult: publishRecord
      ? {
          wordpressPostId: publishRecord.wordpressPostId,
          wordpressUrl: publishRecord.wordpressUrl,
          sheetRowId: publishRecord.sheetRowId,
          telegramMessageId: publishRecord.telegramMessageId,
        }
      : null,
    selectedVariant: selectedArticle
      ? {
          variantNo: selectedArticle.variantNo,
          title: selectedArticle.articleVariant.title,
          body: selectedArticle.articleVariant.body,
          metaDescription: selectedArticle.articleVariant.metaDescription,
          thumbnailPrompt: selectedArticle.articleVariant.thumbnailPrompt,
          sourceCount: 0,
        }
      : null,
  };
}

export async function runJobPipeline(jobId: string) {
  const job = await db.job.findUnique({ where: { id: jobId } });

  if (!job) {
    throw new Error("Job not found.");
  }

  const latestStageRun = await db.jobStageRun.findFirst({
    where: { jobId },
    orderBy: [{ attempt: "desc" }, { createdAt: "desc" }],
  });
  const attempt = (latestStageRun?.attempt ?? 0) + 1;
  const startIndex = getStartIndex(job.currentStage);

  let craftResult:
    | Awaited<ReturnType<typeof craftFromCoinPage>>
    | null = null;
  let selectedVariant:
    | PipelineSelectedVariant
    | null = null;
  let publishResult:
    | {
        wordpressPostId: string | null;
        wordpressUrl: string | null;
        sheetRowId?: string | null;
        telegramMessageId?: string | null;
      }
    | null = null;
  let sheetsResult:
    | Awaited<ReturnType<typeof appendGoogleSheetsLog>>
    | null = null;

  const persistedContext =
    startIndex > getStartIndex("select_best") - 1 ? await loadPersistedContext(jobId) : null;

  selectedVariant = persistedContext?.selectedVariant ?? null;
  publishResult = persistedContext?.publishResult ?? null;

  await db.job.update({
    where: { id: jobId },
    data: {
      status: "running",
      errorMessage: null,
    },
  });

  for (let index = startIndex; index < stageOrder.length; index += 1) {
    const stage = stageOrder[index];

    await db.job.update({
      where: { id: jobId },
      data: {
        currentStage: stage,
      },
    });

    try {
      if (stage === "research") {
        craftResult = await runStage({
          jobId,
          stage,
          attempt,
          input: { cmcUrl: job.cmcUrl, coinSlug: job.coinSlug },
          work: async () => craftFromCoinPage(job.cmcUrl, job.coinSlug ?? "unknown"),
        });
      }

      if (stage === "draft_variants") {
        craftResult ??= await craftFromCoinPage(job.cmcUrl, job.coinSlug ?? "unknown");
        const draftResult = craftResult;

        await runStage({
          jobId,
          stage,
          attempt,
          input: { variantCount: draftResult.variants.length },
          work: async () =>
            Promise.all(
              draftResult.variants.map((variant) =>
                db.articleVariant.upsert({
                  where: {
                    jobId_variantNo: {
                      jobId,
                      variantNo: variant.variantNo,
                    },
                  },
                  update: {
                    title: variant.title,
                    body: variant.body,
                    metaDescription: variant.metaDescription,
                    thumbnailPrompt: variant.thumbnailPrompt,
                    scoreJson: JSON.parse(JSON.stringify({ sourceCount: variant.sourceCount })),
                  },
                  create: {
                    jobId,
                    variantNo: variant.variantNo,
                    title: variant.title,
                    body: variant.body,
                    metaDescription: variant.metaDescription,
                    thumbnailPrompt: variant.thumbnailPrompt,
                    scoreJson: JSON.parse(JSON.stringify({ sourceCount: variant.sourceCount })),
                  },
                }),
              ),
            ),
        });
      }

      if (stage === "select_best") {
        craftResult ??= await craftFromCoinPage(job.cmcUrl, job.coinSlug ?? "unknown");
        const currentCraftResult = craftResult;
        selectedVariant =
          currentCraftResult.variants.find(
            (variant) => variant.variantNo === currentCraftResult.selectedVariantNo,
          ) ??
          currentCraftResult.variants[0] ??
          null;

        if (!selectedVariant) {
          throw new Error("No article variant available for selection.");
        }

        const chosenVariant = selectedVariant;

        await runStage({
          jobId,
          stage,
          attempt,
          input: { selectedVariantNo: chosenVariant.variantNo },
          work: async () => {
            const articleVariant = await db.articleVariant.findFirstOrThrow({
              where: {
                jobId,
                variantNo: chosenVariant.variantNo,
              },
            });

            return db.selectedArticle.upsert({
              where: { jobId },
              update: {
                articleVariantId: articleVariant.id,
                variantNo: chosenVariant.variantNo,
                bestAngle: currentCraftResult.bestAngle,
                whyBest: currentCraftResult.whyBest,
                banRiskSummary: currentCraftResult.banRiskSummary,
              },
              create: {
                jobId,
                articleVariantId: articleVariant.id,
                variantNo: chosenVariant.variantNo,
                bestAngle: currentCraftResult.bestAngle,
                whyBest: currentCraftResult.whyBest,
                banRiskSummary: currentCraftResult.banRiskSummary,
              },
            });
          },
        });
      }

      if (stage === "seo_assets") {
        const currentCraftResult = craftResult;
        selectedVariant ??=
          currentCraftResult?.variants.find(
            (variant) => variant.variantNo === currentCraftResult.selectedVariantNo,
          ) ?? null;

        await runStage({
          jobId,
          stage,
          attempt,
          input: { hasSelectedVariant: Boolean(selectedVariant) },
          work: async () => ({
            metaDescription: selectedVariant?.metaDescription ?? null,
            thumbnailPrompt: selectedVariant?.thumbnailPrompt ?? null,
          }),
        });
      }

      if (stage === "wordpress_publish") {
        const currentCraftResult = craftResult;
        selectedVariant ??=
          currentCraftResult?.variants.find(
            (variant) => variant.variantNo === currentCraftResult.selectedVariantNo,
          ) ?? null;
        selectedVariant ??= (await loadPersistedContext(jobId)).selectedVariant;

        if (!selectedVariant) {
          throw new Error("Cannot publish without a selected article.");
        }

        const publishVariant = selectedVariant;

        publishResult = await runStage({
          jobId,
          stage,
          attempt,
          input: { title: publishVariant.title },
          work: async () =>
            createWordPressDraft({
              title: publishVariant.title,
              body: publishVariant.body,
              metaDescription: publishVariant.metaDescription,
            }),
        });

        await db.publishResult.upsert({
          where: { jobId },
          update: publishResult,
          create: {
            jobId,
            ...publishResult,
          },
        });
      }

      if (stage === "sheets_log") {
        const currentCraftResult = craftResult;
        selectedVariant ??=
          currentCraftResult?.variants.find(
            (variant) => variant.variantNo === currentCraftResult.selectedVariantNo,
          ) ?? null;
        const persisted = await loadPersistedContext(jobId);
        selectedVariant ??= persisted.selectedVariant;
        publishResult ??= persisted.publishResult;

        if (!selectedVariant || !publishResult?.wordpressUrl) {
          throw new Error("Cannot log to Google Sheets before a WordPress draft exists.");
        }

        const selectedForSheets = selectedVariant;
        const publishForSheets = publishResult;
        const sheetsWordPressUrl = publishForSheets.wordpressUrl;

        if (!sheetsWordPressUrl) {
          throw new Error("Cannot log to Google Sheets before a WordPress draft exists.");
        }

        sheetsResult = await runStage({
          jobId,
          stage,
          attempt,
          input: { wordpressUrl: sheetsWordPressUrl },
          work: async () =>
            appendGoogleSheetsLog({
              coinSlug: job.coinSlug ?? "unknown",
              cmcUrl: job.cmcUrl,
              title: selectedForSheets.title,
              wordpressUrl: sheetsWordPressUrl,
              status: "draft_created",
            }),
        });

        await db.publishResult.upsert({
          where: { jobId },
          update: {
            sheetRowId: sheetsResult.sheetRowId,
          },
          create: {
            jobId,
            sheetRowId: sheetsResult.sheetRowId,
          },
        });
      }

      if (stage === "telegram_notify") {
        const currentCraftResult = craftResult;
        selectedVariant ??=
          currentCraftResult?.variants.find(
            (variant) => variant.variantNo === currentCraftResult.selectedVariantNo,
          ) ?? null;
        const persisted = await loadPersistedContext(jobId);
        selectedVariant ??= persisted.selectedVariant;
        publishResult ??= persisted.publishResult;

        if (!selectedVariant || !publishResult?.wordpressUrl) {
          throw new Error("Cannot notify Telegram before a WordPress draft exists.");
        }

        const selectedForTelegram = selectedVariant;
        const publishForTelegram = publishResult;
        const telegramWordPressUrl = publishForTelegram.wordpressUrl;

        if (!telegramWordPressUrl) {
          throw new Error("Cannot notify Telegram before a WordPress draft exists.");
        }

        const telegramResult = await runStage({
          jobId,
          stage,
          attempt,
          input: { wordpressUrl: telegramWordPressUrl },
          work: async () =>
            sendTelegramNotification({
              coinSlug: job.coinSlug ?? "unknown",
              title: selectedForTelegram.title,
              wordpressUrl: telegramWordPressUrl,
              jobId,
            }),
        });

        await db.publishResult.upsert({
          where: { jobId },
          update: {
            telegramMessageId: telegramResult.telegramMessageId,
          },
          create: {
            jobId,
            telegramMessageId: telegramResult.telegramMessageId,
          },
        });
      }
    } catch (error) {
      const partialFailure = stage === "wordpress_publish" || stage === "sheets_log" || stage === "telegram_notify";

      await db.job.update({
        where: { id: jobId },
        data: {
          status: partialFailure ? "partial_failed" : "failed",
          currentStage: stage,
          errorMessage: error instanceof Error ? error.message : "Unknown pipeline error.",
        },
      });

      throw error;
    }
  }

  await db.job.update({
    where: { id: jobId },
    data: {
      status: "completed",
      currentStage: null,
      errorMessage: null,
    },
  });
}
