type QueueItem = {
  variantNo: number;
  title: string;
};

type PublicationSlot = {
  status: "publish" | "future";
  scheduledAt: string | null;
};

const SCHEDULE_HOURS = [0, 6, 12, 24] as const;

function toWordPressDateGmt(date: Date) {
  return date.toISOString().replace(".000Z", "Z");
}

export function buildPublishQueue<T extends QueueItem>(variants: T[], selectedVariantNo: number) {
  const selected = variants.find((variant) => variant.variantNo === selectedVariantNo);
  const remaining = variants.filter((variant) => variant.variantNo !== selectedVariantNo);

  return selected ? [selected, ...remaining] : [...variants];
}

export function buildPublicationSchedule(baseDate: Date): PublicationSlot[] {
  return SCHEDULE_HOURS.map((offsetHours, index) => {
    if (index === 0) {
      return {
        status: "publish",
        scheduledAt: null,
      };
    }

    const scheduledAt = new Date(baseDate.getTime() + offsetHours * 60 * 60 * 1000);
    return {
      status: "future",
      scheduledAt: toWordPressDateGmt(scheduledAt),
    };
  });
}
