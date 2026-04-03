import { Buffer } from "node:buffer";

import { isMockMode } from "@/lib/integrations/mode";

const FLOW_THUMBNAIL_STYLE_TEMPLATE = `Style: High-impact crypto thumbnail in bold comic / game-art style.

Main object must:
- Have thick black outline
- Have thin white outer stroke around the black outline (sticker-style separation)
- Pop out clearly from background
- Use semi-3D cartoon shading
- Have strong contrast and glossy highlights

Lighting:
- Dramatic directional lighting
- Strong highlight and shadow contrast
- No soft painterly shading

Background:
- Slightly darker than foreground object
- Financial grid, chart lines, or thematic elements relevant to topic
- Lower contrast than main object
- No blur, but visually secondary

Color:
- High saturation
- Strong contrast
- Bold crypto energy
- No muted pastel palette

Texture:
- Clean edges
- No grain
- No glitch
- No realism

Mood:
Eye-catching, bold, high-volatility crypto news energy.`;

export type GeneratedFeaturedImage = {
  buffer: Buffer;
  filename: string;
  mimeType: string;
  prompt: string;
  source: "flow-worker";
};

type GenerateFeaturedImageInput = {
  title: string;
  thumbnailPrompt: string | null;
  coinSlug: string | null;
};

type FlowWorkerResponse = {
  filename?: string;
  imageBase64?: string;
  imageUrl?: string;
  mimeType?: string;
};

export function buildFlowFeaturedImagePrompt(title: string, thumbnailPrompt: string | null) {
  const basePrompt = (thumbnailPrompt?.trim() || title.trim()).replace(/\s+/g, " ");

  return `${basePrompt}, ${FLOW_THUMBNAIL_STYLE_TEMPLATE}`;
}

async function resolveImageBuffer(payload: FlowWorkerResponse) {
  if (payload.imageBase64) {
    return Buffer.from(payload.imageBase64, "base64");
  }

  if (payload.imageUrl) {
    const response = await fetch(payload.imageUrl);

    if (!response.ok) {
      throw new Error(`Flow image download failed with status ${response.status}.`);
    }

    return Buffer.from(await response.arrayBuffer());
  }

  throw new Error("Flow worker response did not include imageBase64 or imageUrl.");
}

export async function generateFeaturedImage(
  input: GenerateFeaturedImageInput,
): Promise<GeneratedFeaturedImage | null> {
  if (isMockMode()) {
    return null;
  }

  const workerUrl = process.env.FLOW_IMAGE_WORKER_URL?.trim();

  if (!workerUrl) {
    return null;
  }

  const prompt = buildFlowFeaturedImagePrompt(input.title, input.thumbnailPrompt);
  const authToken = process.env.FLOW_IMAGE_WORKER_TOKEN?.trim();
  const response = await fetch(workerUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    },
    body: JSON.stringify({
      coinSlug: input.coinSlug,
      prompt,
      title: input.title,
    }),
  });

  if (!response.ok) {
    throw new Error(`Flow worker request failed with status ${response.status}.`);
  }

  const payload = (await response.json()) as FlowWorkerResponse;
  const buffer = await resolveImageBuffer(payload);

  return {
    buffer,
    filename:
      payload.filename?.trim() ||
      `${(input.coinSlug?.trim() || "featured-image").replace(/[^a-z0-9-]+/gi, "-").toLowerCase()}.png`,
    mimeType: payload.mimeType?.trim() || "image/png",
    prompt,
    source: "flow-worker",
  };
}
