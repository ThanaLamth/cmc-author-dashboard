import { NextResponse } from "next/server";

import {
  authenticateDashboardUser,
  createSessionToken,
  DASHBOARD_SESSION_COOKIE,
  getDashboardCookieSecure,
  getDashboardSessionSecret,
  getDashboardUsers,
} from "@/lib/auth/dashboard-auth";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as
    | { username?: string; password?: string; redirectTo?: string }
    | null;

  if (!body?.username || !body?.password) {
    return NextResponse.json({ error: "username and password are required." }, { status: 400 });
  }

  const users = getDashboardUsers();
  if (!authenticateDashboardUser(users, body.username, body.password)) {
    return NextResponse.json({ error: "Invalid username or password." }, { status: 401 });
  }

  const response = NextResponse.json({
    ok: true,
    redirectTo: body.redirectTo?.startsWith("/") ? body.redirectTo : "/",
  });

  response.cookies.set(
    DASHBOARD_SESSION_COOKIE,
    await createSessionToken(body.username, getDashboardSessionSecret()),
    {
      httpOnly: true,
      sameSite: "lax",
      secure: getDashboardCookieSecure(),
      path: "/",
    },
  );

  return response;
}
