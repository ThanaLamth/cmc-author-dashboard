import { db } from "@/lib/db";

export async function listJobs() {
  return db.job.findMany({
    orderBy: {
      updatedAt: "desc",
    },
  });
}

export async function getJobById(id: string) {
  return db.job.findUnique({
    where: { id },
    include: {
      stageRuns: {
        orderBy: [{ createdAt: "asc" }],
      },
      articleVariants: {
        orderBy: [{ variantNo: "asc" }],
      },
      publishedPosts: {
        orderBy: [{ publishOrder: "asc" }],
      },
      selectedArticle: true,
      publishResult: true,
    },
  });
}
