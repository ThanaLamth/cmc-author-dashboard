import { describe, expect, it } from "vitest";

import {
  authenticateDashboardUser,
  createSessionToken,
  getDashboardCookieSecure,
  parseDashboardUsers,
  verifySessionToken,
} from "@/lib/auth/dashboard-auth";

describe("dashboard auth", () => {
  it("parses dashboard users from json", () => {
    expect(
      parseDashboardUsers('{"thana":"Thana!Ops#4829_CMC","tommy":"Tommy$Wave_7316!CDA"}'),
    ).toEqual({
      thana: "Thana!Ops#4829_CMC",
      tommy: "Tommy$Wave_7316!CDA",
    });
  });

  it("authenticates valid credentials only", () => {
    const users = {
      thana: "Thana!Ops#4829_CMC",
      tommy: "Tommy$Wave_7316!CDA",
    };

    expect(authenticateDashboardUser(users, "thana", "Thana!Ops#4829_CMC")).toBe(true);
    expect(authenticateDashboardUser(users, "thana", "wrong")).toBe(false);
    expect(authenticateDashboardUser(users, "nobody", "Thana!Ops#4829_CMC")).toBe(false);
  });

  it("creates and verifies signed session tokens", async () => {
    const token = await createSessionToken("thana", "super-secret");

    await expect(verifySessionToken(token, "super-secret")).resolves.toEqual({ username: "thana" });
    await expect(verifySessionToken(token, "wrong-secret")).resolves.toBeNull();
  });

  it("defaults dashboard cookie secure flag to false unless explicitly enabled", () => {
    expect(getDashboardCookieSecure({} as NodeJS.ProcessEnv)).toBe(false);
    expect(getDashboardCookieSecure({ DASHBOARD_COOKIE_SECURE: "false" } as NodeJS.ProcessEnv)).toBe(
      false,
    );
    expect(getDashboardCookieSecure({ DASHBOARD_COOKIE_SECURE: "true" } as NodeJS.ProcessEnv)).toBe(
      true,
    );
  });
});
