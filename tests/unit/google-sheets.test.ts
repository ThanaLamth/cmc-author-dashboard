import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { getAccessTokenMock, jwtConstructorMock } = vi.hoisted(() => {
  const getAccessToken = vi.fn();
  const jwtConstructor = vi.fn(function MockJwt() {
    return {
      getAccessToken,
    };
  });

  return {
    getAccessTokenMock: getAccessToken,
    jwtConstructorMock: jwtConstructor,
  };
});

vi.mock("google-auth-library", () => ({
  JWT: jwtConstructorMock,
}));

import { appendGoogleSheetsLog } from "@/lib/integrations/google-sheets";

describe("appendGoogleSheetsLog", () => {
  const envBackup = { ...process.env };

  beforeEach(() => {
    process.env = {
      ...envBackup,
      INTEGRATION_MODE: "live",
      GOOGLE_SHEETS_SPREADSHEET_ID: "spreadsheet-123",
      GOOGLE_SHEETS_WORKSHEET_NAME: "Drafts",
      GOOGLE_SERVICE_ACCOUNT_EMAIL: "service@example.iam.gserviceaccount.com",
      GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY: "-----BEGIN PRIVATE KEY-----\\nabc\\n-----END PRIVATE KEY-----\\n",
    };
    getAccessTokenMock.mockResolvedValue({ token: "google-access-token" });
  });

  afterEach(() => {
    process.env = { ...envBackup };
    vi.restoreAllMocks();
    getAccessTokenMock.mockReset();
    jwtConstructorMock.mockClear();
  });

  it("authenticates with the Google service account and appends a row in live mode", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        updates: {
          updatedRange: "Drafts!A2:F2",
        },
      }),
    });

    vi.stubGlobal("fetch", fetchMock);

    const result = await appendGoogleSheetsLog({
      coinSlug: "anome",
      cmcUrl: "https://coinmarketcap.com/currencies/anome/",
      title: "Anome draft title",
      wordpressUrl: "https://example.com/draft/1",
      status: "draft_created",
    });

    expect(jwtConstructorMock).toHaveBeenCalledWith(
      expect.objectContaining({
        email: "service@example.iam.gserviceaccount.com",
        key: "-----BEGIN PRIVATE KEY-----\nabc\n-----END PRIVATE KEY-----\n",
        scopes: ["https://www.googleapis.com/auth/spreadsheets"],
      }),
    );
    expect(getAccessTokenMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://sheets.googleapis.com/v4/spreadsheets/spreadsheet-123/values/Drafts!A%3AF:append?valueInputOption=USER_ENTERED",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer google-access-token",
          "Content-Type": "application/json",
        }),
      }),
    );

    const request = fetchMock.mock.calls[0]?.[1];
    const body = JSON.parse(String(request?.body));
    expect(body.values[0]).toEqual([
      "anome",
      "https://coinmarketcap.com/currencies/anome/",
      "Anome draft title",
      "https://example.com/draft/1",
      "draft_created",
      expect.any(String),
    ]);
    expect(result).toEqual({ sheetRowId: "Drafts!A2:F2" });
  });
});
