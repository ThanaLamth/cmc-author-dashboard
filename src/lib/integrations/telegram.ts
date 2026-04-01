import { isMockMode, requireLiveEnv } from "@/lib/integrations/mode";

type TelegramInput = {
  coinSlug: string;
  jobId: string;
  items: Array<{
    variantNo: number;
    title: string;
    wordpressUrl: string;
    status: string;
    scheduledAt: string | null;
  }>;
};

export async function sendTelegramNotification(
  input: TelegramInput,
): Promise<{ telegramMessageId: string }> {
  if (isMockMode()) {
    return { telegramMessageId: "mock-message-1" };
  }

  const token = requireLiveEnv("TELEGRAM_BOT_TOKEN", process.env.TELEGRAM_BOT_TOKEN);
  const chatId = requireLiveEnv("TELEGRAM_CHAT_ID", process.env.TELEGRAM_CHAT_ID);

  const text = [
    "CMC publish queue created",
    `Coin: ${input.coinSlug}`,
    `Job: ${input.jobId}`,
    ...input.items.map((item) =>
      [
        `Variant ${item.variantNo}: ${item.title}`,
        `Status: ${item.status}${item.scheduledAt ? ` at ${item.scheduledAt}` : ""}`,
        `URL: ${item.wordpressUrl}`,
      ].join("\n"),
    ),
  ].join("\n\n");

  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      disable_web_page_preview: true,
    }),
  });

  if (!response.ok) {
    throw new Error(`Telegram notification failed with status ${response.status}.`);
  }

  const payload = (await response.json()) as { result?: { message_id?: number } };
  return { telegramMessageId: String(payload.result?.message_id ?? "unknown") };
}
