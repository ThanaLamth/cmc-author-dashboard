type VariantInput = {
  title: string;
  body: string;
  metaDescription?: string | null;
  thumbnailPrompt?: string | null;
  sourceCount?: number;
};

export type VariantScore = {
  hookStrength: number;
  structure: number;
  seoReadiness: number;
  evidenceDensity: number;
  total: number;
};

export function scoreVariant(variant: VariantInput): VariantScore {
  const titleLength = variant.title.trim().length;
  const bodyLength = variant.body.trim().length;
  const metaReady = variant.metaDescription ? 1 : 0;
  const thumbReady = variant.thumbnailPrompt ? 1 : 0;
  const sourceCount = variant.sourceCount ?? 0;

  const hookStrength = Math.min(40, Math.max(12, Math.round(titleLength / 2)));
  const structure = Math.min(25, Math.max(8, Math.round(bodyLength / 120)));
  const seoReadiness = metaReady * 10 + thumbReady * 10;
  const evidenceDensity = Math.min(15, sourceCount * 3);
  const total = hookStrength + structure + seoReadiness + evidenceDensity;

  return {
    hookStrength,
    structure,
    seoReadiness,
    evidenceDensity,
    total,
  };
}

export function pickBestVariant<T extends VariantInput>(variants: T[]) {
  const scored = variants.map((variant, index) => ({
    index,
    variant,
    score: scoreVariant(variant),
  }));

  scored.sort((left, right) => right.score.total - left.score.total);
  return scored[0] ?? null;
}
