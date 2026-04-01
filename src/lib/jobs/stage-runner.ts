import { db } from "@/lib/db";

type StageRunnerInput<T> = {
  attempt: number;
  input?: unknown;
  jobId: string;
  stage: string;
  work: () => Promise<T>;
};

export async function runStage<T>({ attempt, input, jobId, stage, work }: StageRunnerInput<T>) {
  const stageRun = await db.jobStageRun.create({
    data: {
      jobId,
      stage,
      attempt,
      status: "running",
      input: input ? JSON.parse(JSON.stringify(input)) : undefined,
      startedAt: new Date(),
    },
  });

  try {
    const output = await work();

    await db.jobStageRun.update({
      where: { id: stageRun.id },
      data: {
        status: "completed",
        output: JSON.parse(JSON.stringify(output)),
        finishedAt: new Date(),
      },
    });

    return output;
  } catch (error) {
    await db.jobStageRun.update({
      where: { id: stageRun.id },
      data: {
        status: "failed",
        errorMessage: error instanceof Error ? error.message : "Unknown stage error.",
        finishedAt: new Date(),
      },
    });

    throw error;
  }
}
