import { isMockMode, requireLiveEnv } from "@/lib/integrations/mode";

const CMC_CATEGORY_ID = 148;
const RANK_MATH_NOINDEX_META = {
  rank_math_robots: ["noindex"],
};

type PublishDraftInput = {
  title: string;
  body: string;
  metaDescription: string | null;
  status: "draft" | "publish" | "future";
  scheduledAt: string | null;
};

type PublishDraftResult = {
  wordpressPostId: string;
  wordpressUrl: string;
};

async function applyRankMathNoindex({
  auth,
  baseUrl,
  wordpressPostId,
}: {
  auth: string;
  baseUrl: string;
  wordpressPostId: number;
}) {
  const response = await fetch(`${baseUrl}/wp-json/rankmath/v1/updateMeta`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      objectType: "post",
      objectID: wordpressPostId,
      meta: RANK_MATH_NOINDEX_META,
    }),
  });

  if (!response.ok) {
    throw new Error(`WordPress Rank Math noindex update failed with status ${response.status}.`);
  }
}

export async function createWordPressPost(input: PublishDraftInput): Promise<PublishDraftResult> {
  if (isMockMode()) {
    return {
      wordpressPostId: "mock-draft",
      wordpressUrl: "https://example.com/mock-wordpress-draft?mode=mock",
    };
  }

  const baseUrl = requireLiveEnv("WORDPRESS_BASE_URL", process.env.WORDPRESS_BASE_URL);
  const username = requireLiveEnv("WORDPRESS_USERNAME", process.env.WORDPRESS_USERNAME);
  const appPassword = requireLiveEnv("WORDPRESS_APP_PASSWORD", process.env.WORDPRESS_APP_PASSWORD);

  const auth = Buffer.from(`${username}:${appPassword}`).toString("base64");
  const response = await fetch(`${baseUrl.replace(/\/$/, "")}/wp-json/wp/v2/posts`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      title: input.title,
      content: input.body,
      status: input.status,
      excerpt: input.metaDescription,
      categories: [CMC_CATEGORY_ID],
      meta: RANK_MATH_NOINDEX_META,
      ...(input.scheduledAt ? { date_gmt: input.scheduledAt } : {}),
    }),
  });

  if (!response.ok) {
    throw new Error(`WordPress draft creation failed with status ${response.status}.`);
  }

  const payload = (await response.json()) as { id: number; link: string };
  await applyRankMathNoindex({
    auth,
    baseUrl: baseUrl.replace(/\/$/, ""),
    wordpressPostId: payload.id,
  });

  return {
    wordpressPostId: String(payload.id),
    wordpressUrl: payload.link,
  };
}

export async function createWordPressDraft(input: Omit<PublishDraftInput, "status" | "scheduledAt">) {
  return createWordPressPost({
    ...input,
    status: "draft",
    scheduledAt: null,
  });
}
