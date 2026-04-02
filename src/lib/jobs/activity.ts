const TERMINAL_JOB_STATUSES = new Set(["completed", "failed", "partial_failed"]);

export function isActiveJobStatus(status: string) {
  return !TERMINAL_JOB_STATUSES.has(status);
}

export function shouldPollJobs(statuses: string[]) {
  return statuses.some((status) => isActiveJobStatus(status));
}
