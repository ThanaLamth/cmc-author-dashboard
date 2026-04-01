import { db } from "@/lib/db";
import { craftFromCoinPage } from "@/lib/integrations/top-cmc-writer";
import { appendGoogleSheetsLog } from "@/lib/integrations/google-sheets";
import { sendTelegramNotification } from "@/lib/integrations/telegram";
import { createWordPressPost } from "@/lib/integrations/wordpress";
import { JOB_STAGES, type JobStage } from "@/lib/jobs/constants";
import { buildPublicationSchedule, buildPublishQueue } from "@/lib/jobs/publishing-plan";
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
  const [selectedArticle, publishRecord, publishedPosts] = await Promise.all([
    db.selectedArticle.findUnique({
      where: { jobId },
      include: {
        articleVariant: true,
      },
    }),
    db.publishResult.findUnique({
      where: { jobId },
    }),
    db.publishedPost.findMany({
      where: { jobId },
      include: {
        articleVariant: true,
      },
      orderBy: [{ publishOrder: "asc" }],
    }),
  ]);

  return {
    publishedPosts: publishedPosts.map((post) => ({
      variantNo: post.variantNo,
      publishOrder: post.publishOrder,
      title: post.articleVariant.title,
      wordpressPostId: post.wordpressPostId,
      wordpressUrl: post.wordpressUrl,
      publishStatus: post.publishStatus as "publish" | "future",
      scheduledAt: post.scheduledAt?.toISOString().replace(".000Z", "Z") ?? null,
      sheetRowId: post.sheetRowId,
    })),
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
  let publishedPosts:
    | Array<{
        variantNo: number;
        publishOrder: number;
        title: string;
        wordpressPostId: string | null;
        wordpressUrl: string | null;
        publishStatus: "publish" | "future";
        scheduledAt: string | null;
        sheetRowId?: string | null;
      }>
    | null = null;

  const persistedContext =
    startIndex > getStartIndex("select_best") - 1 ? await loadPersistedContext(jobId) : null;

  selectedVariant = persistedContext?.selectedVariant ?? null;
  publishResult = persistedContext?.publishResult ?? null;
  publishedPosts = persistedContext?.publishedPosts ?? null;

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
        craftResult ??= await craftFromCoinPage(job.cmcUrl, job.coinSlug ?? "unknown");
        const publishQueue = buildPublishQueue(craftResult.variants, craftResult.selectedVariantNo);
        const schedule = buildPublicationSchedule(new Date());

        const publishStageResult = await runStage({
          jobId,
          stage,
          attempt,
          input: { variantCount: publishQueue.length },
          work: async () => {
            const existingPosts = await db.publishedPost.findMany({
              where: { jobId },
            });

            const published = [];
            for (const [index, variant] of publishQueue.entries()) {
              const existing = existingPosts.find((post) => post.variantNo === variant.variantNo);

              if (existing?.wordpressPostId && existing.wordpressUrl) {
                published.push({
                  variantNo: variant.variantNo,
                  publishOrder: index,
                  title: variant.title,
                  wordpressPostId: existing.wordpressPostId,
                  wordpressUrl: existing.wordpressUrl,
                  publishStatus: existing.publishStatus as "publish" | "future",
                  scheduledAt: existing.scheduledAt?.toISOString().replace(".000Z", "Z") ?? null,
                  sheetRowId: existing.sheetRowId,
                });
                continue;
              }

              const slot = schedule[index];
              const wpPost = await createWordPressPost({
                title: variant.title,
                body: variant.body,
                metaDescription: variant.metaDescription,
                status: slot?.status ?? "future",
                scheduledAt: slot?.scheduledAt ?? null,
              });

              const saved = await db.publishedPost.upsert({
                where: {
                  jobId_variantNo: {
                    jobId,
                    variantNo: variant.variantNo,
                  },
                },
                update: {
                  articleVariantId: (
                    await db.articleVariant.findFirstOrThrow({
                      where: { jobId, variantNo: variant.variantNo },
                    })
                  ).id,
                  publishOrder: index,
                  wordpressPostId: wpPost.wordpressPostId,
                  wordpressUrl: wpPost.wordpressUrl,
                  publishStatus: slot?.status ?? "future",
                  scheduledAt: slot?.scheduledAt ? new Date(slot.scheduledAt) : null,
                },
                create: {
                  jobId,
                  articleVariantId: (
                    await db.articleVariant.findFirstOrThrow({
                      where: { jobId, variantNo: variant.variantNo },
                    })
                  ).id,
                  variantNo: variant.variantNo,
                  publishOrder: index,
                  wordpressPostId: wpPost.wordpressPostId,
                  wordpressUrl: wpPost.wordpressUrl,
                  publishStatus: slot?.status ?? "future",
                  scheduledAt: slot?.scheduledAt ? new Date(slot.scheduledAt) : null,
                },
              });

              published.push({
                variantNo: variant.variantNo,
                publishOrder: index,
                title: variant.title,
                wordpressPostId: wpPost.wordpressPostId,
                wordpressUrl: wpPost.wordpressUrl,
                publishStatus: saved.publishStatus as "publish" | "future",
                scheduledAt: saved.scheduledAt?.toISOString().replace(".000Z", "Z") ?? null,
                sheetRowId: saved.sheetRowId,
              });
            }

            return published;
          },
        });

        publishedPosts = publishStageResult;
        const primaryPost = publishStageResult[0];

        if (!primaryPost) {
          throw new Error("No WordPress post was created.");
        }

        publishResult = {
          wordpressPostId: primaryPost.wordpressPostId,
          wordpressUrl: primaryPost.wordpressUrl,
        };

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
        const persisted = await loadPersistedContext(jobId);
        publishResult ??= persisted.publishResult;
        publishedPosts ??= persisted.publishedPosts.map((post) => ({
          ...post,
          title:
            craftResult?.variants.find((variant) => variant.variantNo === post.variantNo)?.title ?? "",
        }));

        if (!publishedPosts.length) {
          throw new Error("Cannot log to Google Sheets before WordPress posts exist.");
        }

        const sheetsStageResult = await runStage({
          jobId,
          stage,
          attempt,
          input: { postCount: publishedPosts.length },
          work: async () => {
            const variantsByNo = new Map(
              (
                craftResult?.variants ??
                (await db.articleVariant.findMany({ where: { jobId } })).map((variant) => ({
                  variantNo: variant.variantNo,
                  title: variant.title,
                }))
              ).map((variant) => [variant.variantNo, variant]),
            );

            const logged = [];
            for (const post of publishedPosts ?? []) {
              if (!post.wordpressUrl) {
                continue;
              }

              const row = await appendGoogleSheetsLog({
                coinSlug: job.coinSlug ?? "unknown",
                cmcUrl: job.cmcUrl,
                variantNo: post.variantNo,
                title: variantsByNo.get(post.variantNo)?.title ?? post.title,
                wordpressUrl: post.wordpressUrl,
                status: post.publishStatus,
                scheduledAt: post.scheduledAt,
              });

              await db.publishedPost.update({
                where: {
                  jobId_variantNo: {
                    jobId,
                    variantNo: post.variantNo,
                  },
                },
                data: {
                  sheetRowId: row.sheetRowId,
                },
              });

              logged.push({
                ...post,
                title: variantsByNo.get(post.variantNo)?.title ?? post.title,
                sheetRowId: row.sheetRowId,
              });
            }

            return logged;
          },
        });

        publishedPosts = sheetsStageResult;
        const primaryLoggedPost = sheetsStageResult[0];
        if (primaryLoggedPost?.sheetRowId) {
          await db.publishResult.upsert({
            where: { jobId },
            update: {
              sheetRowId: primaryLoggedPost.sheetRowId,
            },
            create: {
              jobId,
              sheetRowId: primaryLoggedPost.sheetRowId,
            },
          });
        }
      }

      if (stage === "telegram_notify") {
        const persisted = await loadPersistedContext(jobId);
        publishResult ??= persisted.publishResult;
        publishedPosts ??= persisted.publishedPosts.map((post) => ({
          ...post,
          title:
            craftResult?.variants.find((variant) => variant.variantNo === post.variantNo)?.title ?? "",
        }));

        if (!publishedPosts.length) {
          throw new Error("Cannot notify Telegram before WordPress posts exist.");
        }

        const telegramItems = publishedPosts
          .filter((post) => Boolean(post.wordpressUrl))
          .map((post) => ({
            variantNo: post.variantNo,
            title: post.title,
            wordpressUrl: post.wordpressUrl!,
            status: post.publishStatus,
            scheduledAt: post.scheduledAt,
          }));

        if (!telegramItems.length) {
          throw new Error("Cannot notify Telegram before WordPress post URLs exist.");
        }

        const telegramResult = await runStage({
          jobId,
          stage,
          attempt,
          input: { postCount: telegramItems.length },
          work: async () =>
            sendTelegramNotification({
              coinSlug: job.coinSlug ?? "unknown",
              jobId,
              items: telegramItems,
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
