type BanRiskInput = {
  title: string;
  body: string;
  sourceCount?: number;
};

export function summarizeBanRisk(input: BanRiskInput) {
  const lowerTitle = input.title.toLowerCase();
  const lowerBody = input.body.toLowerCase();

  const risks: string[] = [];

  if (lowerTitle.includes("scam") || lowerBody.includes("scam")) {
    risks.push("title or body uses high-risk accusatory wording");
  }

  if (lowerTitle.includes("buy now") || lowerBody.includes("buy now")) {
    risks.push("language could read as promotional");
  }

  if ((input.sourceCount ?? 0) === 0) {
    risks.push("no explicit supporting sources were counted");
  }

  if (lowerBody.includes("guaranteed") || lowerBody.includes("definitely")) {
    risks.push("language may overclaim beyond the evidence");
  }

  if (risks.length === 0) {
    return "No obvious spam or manipulation pattern detected in this draft. Keep tone analytical and source-backed.";
  }

  return `Review before publishing: ${risks.join("; ")}.`;
}
