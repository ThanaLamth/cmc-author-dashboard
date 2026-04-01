import { runJobPipeline } from "@/lib/jobs/pipeline";

export async function runJob(jobId: string) {
  await runJobPipeline(jobId);
}
