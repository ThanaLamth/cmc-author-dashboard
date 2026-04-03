import { isMockMode } from "@/lib/integrations/mode";
import {
  resolveWordPressSiteConfig,
  type WordPressSiteKey,
} from "@/lib/integrations/wordpress-sites";

const RANK_MATH_NOINDEX_META = {
  rank_math_robots: ["noindex"],
};

type PublishDraftInput = {
  title: string;
  body: string;
  metaDescription: string | null;
  targetSite: WordPressSiteKey;
  status: "draft" | "publish" | "future";
  scheduledAt: string | null;
  featuredMediaId?: number | null;
};

type PublishDraftResult = {
  wordpressPostId: string;
  wordpressUrl: string;
};

type UploadFeaturedImageInput = {
  targetSite: WordPressSiteKey;
  buffer: Buffer;
  filename: string;
  mimeType: string;
  title: string;
  altText: string;
};

type UploadFeaturedImageResult = {
  mediaId: number;
  sourceUrl: string | null;
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

  const site = resolveWordPressSiteConfig(input.targetSite);
  const baseUrl = site.baseUrl.replace(/\/$/, "");
  const username = site.username;
  const appPassword = site.appPassword;

  const auth = Buffer.from(`${username}:${appPassword}`).toString("base64");
  const response = await fetch(`${baseUrl}/wp-json/wp/v2/posts`, {
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
      categories: [site.cmcCategoryId],
      meta: RANK_MATH_NOINDEX_META,
      ...(input.featuredMediaId ? { featured_media: input.featuredMediaId } : {}),
      ...(input.scheduledAt ? { date_gmt: input.scheduledAt } : {}),
    }),
  });

  if (!response.ok) {
    throw new Error(`WordPress draft creation failed with status ${response.status}.`);
  }

  const payload = (await response.json()) as { id: number; link: string };
  await applyRankMathNoindex({
    auth,
    baseUrl,
    wordpressPostId: payload.id,
  });

  return {
    wordpressPostId: String(payload.id),
    wordpressUrl: payload.link,
  };
}

export async function uploadWordPressFeaturedImage(
  input: UploadFeaturedImageInput,
): Promise<UploadFeaturedImageResult> {
  if (isMockMode()) {
    return {
      mediaId: 999,
      sourceUrl: "https://example.com/mock-wordpress-media.png?mode=mock",
    };
  }

  const site = resolveWordPressSiteConfig(input.targetSite);
  const baseUrl = site.baseUrl.replace(/\/$/, "");
  const auth = Buffer.from(`${site.username}:${site.appPassword}`).toString("base64");

  const uploadResponse = await fetch(`${baseUrl}/wp-json/wp/v2/media`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Disposition": `attachment; filename="${input.filename}"`,
      "Content-Type": input.mimeType,
    },
    body: new Uint8Array(input.buffer),
  });

  if (!uploadResponse.ok) {
    throw new Error(`WordPress media upload failed with status ${uploadResponse.status}.`);
  }

  const uploadPayload = (await uploadResponse.json()) as { id: number; source_url?: string };

  const metadataResponse = await fetch(`${baseUrl}/wp-json/wp/v2/media/${uploadPayload.id}`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      alt_text: input.altText,
      title: input.title,
    }),
  });

  if (!metadataResponse.ok) {
    throw new Error(`WordPress media metadata update failed with status ${metadataResponse.status}.`);
  }

  return {
    mediaId: uploadPayload.id,
    sourceUrl: uploadPayload.source_url ?? null,
  };
}

export async function createWordPressDraft(input: Omit<PublishDraftInput, "status" | "scheduledAt">) {
  return createWordPressPost({
    ...input,
    status: "draft",
    scheduledAt: null,
  });
}
