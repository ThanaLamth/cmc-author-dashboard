import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { isWordPressSiteKey } from "@/lib/integrations/wordpress-sites";
import { getCoinSlugFromCoinMarketCapUrl, parseCoinMarketCapCoinPageUrl } from "@/lib/jobs/url";
import { listJobs } from "@/lib/jobs/queries";

export async function GET() {
  const jobs = await listJobs();

  return NextResponse.json({
    jobs: jobs.map((job) => ({
      id: job.id,
      cmcUrl: job.cmcUrl,
      coinSlug: job.coinSlug,
      targetSite: job.targetSite,
      status: job.status,
      currentStage: job.currentStage,
      createdAt: job.createdAt.toISOString(),
      updatedAt: job.updatedAt.toISOString(),
    })),
  });
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as
    | { cmcUrl?: string; targetSite?: string }
    | null;

  if (!body?.cmcUrl) {
    return NextResponse.json({ error: "cmcUrl is required." }, { status: 400 });
  }

  if (!body?.targetSite || !isWordPressSiteKey(body.targetSite)) {
    return NextResponse.json({ error: "targetSite is invalid." }, { status: 400 });
  }

  try {
    const cmcUrl = parseCoinMarketCapCoinPageUrl(body.cmcUrl);
    const coinSlug = getCoinSlugFromCoinMarketCapUrl(cmcUrl);

    const job = await db.job.create({
      data: {
        cmcUrl,
        coinSlug,
        targetSite: body.targetSite,
        status: "queued",
        currentStage: "research",
      },
    });

    return NextResponse.json({ id: job.id }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid CoinMarketCap URL.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
