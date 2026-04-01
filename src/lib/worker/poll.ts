import { db } from "@/lib/db";
import { runJob } from "@/lib/worker/run-job";

const POLL_INTERVAL_MS = 3000;

async function claimNextQueuedJob() {
  const candidate = await db.job.findFirst({
    where: { status: "queued" },
    orderBy: { createdAt: "asc" },
  });

  if (!candidate) {
    return null;
  }

  const claimResult = await db.job.updateMany({
    where: {
      id: candidate.id,
      status: "queued",
    },
    data: {
      status: "running",
      errorMessage: null,
    },
  });

  if (claimResult.count === 0) {
    return null;
  }

  return db.job.findUnique({
    where: { id: candidate.id },
  });
}

export async function startWorkerLoop() {
  while (true) {
    const nextJob = await claimNextQueuedJob();

    if (!nextJob) {
      await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
      continue;
    }

    try {
      await runJob(nextJob.id);
    } catch (error) {
      console.error("worker job failed", nextJob.id, error);
    }
  }
}
