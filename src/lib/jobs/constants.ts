export const JOB_STATUSES = ["queued", "running", "completed", "failed", "partial_failed"] as const;
export type JobStatus = (typeof JOB_STATUSES)[number];

export const JOB_STAGES = [
  "research",
  "draft_variants",
  "select_best",
  "seo_assets",
  "wordpress_publish",
  "sheets_log",
  "telegram_notify",
] as const;
export type JobStage = (typeof JOB_STAGES)[number];

export const STAGE_STATUSES = ["pending", "running", "completed", "failed", "skipped"] as const;
export type StageStatus = (typeof STAGE_STATUSES)[number];

export const JOB_STATUS_SET = new Set<string>(JOB_STATUSES);
export const JOB_STAGE_SET = new Set<string>(JOB_STAGES);
export const STAGE_STATUS_SET = new Set<string>(STAGE_STATUSES);
