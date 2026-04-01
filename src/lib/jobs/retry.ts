import { JOB_STAGES, type JobStage } from "@/lib/jobs/constants";

type RetryInput = Array<{
  attempt: number;
  stage: string;
  status: string;
}>;

export function getFirstFailedStage(stageRuns: RetryInput): JobStage | null {
  if (stageRuns.length === 0) {
    return null;
  }

  const latestAttempt = Math.max(...stageRuns.map((stageRun) => stageRun.attempt));
  const failedStages = new Set(
    stageRuns
      .filter((stageRun) => stageRun.attempt === latestAttempt && stageRun.status === "failed")
      .map((stageRun) => stageRun.stage),
  );

  for (const stage of JOB_STAGES) {
    if (failedStages.has(stage)) {
      return stage;
    }
  }

  return null;
}
