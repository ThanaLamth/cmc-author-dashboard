import { JWT } from "google-auth-library";

import { isMockMode, requireLiveEnv } from "@/lib/integrations/mode";

type SheetsLogInput = {
  coinSlug: string;
  cmcUrl: string;
  title: string;
  wordpressUrl: string;
  status: string;
};

function normalizePrivateKey(privateKey: string) {
  return privateKey.replace(/\\n/g, "\n");
}

function getTimestamp() {
  return new Date().toISOString();
}

export async function appendGoogleSheetsLog(input: SheetsLogInput): Promise<{ sheetRowId: string }> {
  if (isMockMode()) {
    return { sheetRowId: "mock-row-1" };
  }

  const spreadsheetId = requireLiveEnv(
    "GOOGLE_SHEETS_SPREADSHEET_ID",
    process.env.GOOGLE_SHEETS_SPREADSHEET_ID,
  );
  const worksheetName = requireLiveEnv(
    "GOOGLE_SHEETS_WORKSHEET_NAME",
    process.env.GOOGLE_SHEETS_WORKSHEET_NAME,
  );
  const serviceAccountEmail = requireLiveEnv(
    "GOOGLE_SERVICE_ACCOUNT_EMAIL",
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
  );
  const privateKey = normalizePrivateKey(
    requireLiveEnv(
      "GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY",
      process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY,
    ),
  );

  const auth = new JWT({
    email: serviceAccountEmail,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  const accessToken = await auth.getAccessToken();
  const token =
    typeof accessToken === "string"
      ? accessToken
      : accessToken?.token;

  if (!token) {
    throw new Error("Google Sheets access token could not be acquired.");
  }

  const range = `${worksheetName}!A:F`;
  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        values: [
          [
            input.coinSlug,
            input.cmcUrl,
            input.title,
            input.wordpressUrl,
            input.status,
            getTimestamp(),
          ],
        ],
      }),
    },
  );

  if (!response.ok) {
    throw new Error(`Google Sheets append failed with status ${response.status}.`);
  }

  const payload = (await response.json()) as {
    updates?: {
      updatedRange?: string;
    };
  };

  return {
    sheetRowId: payload.updates?.updatedRange ?? "unknown",
  };
}
