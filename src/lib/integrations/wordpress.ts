import { isMockMode, requireLiveEnv } from "@/lib/integrations/mode";

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
      ...(input.scheduledAt ? { date_gmt: input.scheduledAt } : {}),
    }),
  });

  if (!response.ok) {
    throw new Error(`WordPress draft creation failed with status ${response.status}.`);
  }

  const payload = (await response.json()) as { id: number; link: string };

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
