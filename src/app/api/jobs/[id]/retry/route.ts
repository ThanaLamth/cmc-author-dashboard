import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { getFirstFailedStage } from "@/lib/jobs/retry";

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const job = await db.job.findUnique({
    where: { id },
    include: {
      stageRuns: {
        orderBy: [{ attempt: "asc" }, { createdAt: "asc" }],
      },
    },
  });

  if (!job) {
    return NextResponse.json({ error: "Job not found." }, { status: 404 });
  }

  const firstFailedStage = getFirstFailedStage(job.stageRuns);

  if (!firstFailedStage) {
    return NextResponse.json({ error: "No failed stage to retry." }, { status: 400 });
  }

  await db.job.update({
    where: { id },
    data: {
      status: "queued",
      currentStage: firstFailedStage,
      errorMessage: null,
    },
  });

  return NextResponse.json({ ok: true, retryFromStage: firstFailedStage });
}
