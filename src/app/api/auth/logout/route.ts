import { NextResponse } from "next/server";

import { DASHBOARD_SESSION_COOKIE, getDashboardCookieSecure } from "@/lib/auth/dashboard-auth";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(DASHBOARD_SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: getDashboardCookieSecure(),
    path: "/",
    expires: new Date(0),
  });
  return response;
}
