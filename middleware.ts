import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import {
  DASHBOARD_SESSION_COOKIE,
  getAuthenticatedDashboardUserAsync,
} from "@/lib/auth/dashboard-auth";

function isProtectedPath(pathname: string) {
  if (pathname.startsWith("/api/auth")) {
    return false;
  }

  if (pathname.startsWith("/api/jobs")) {
    return true;
  }

  return pathname === "/" || pathname.startsWith("/jobs");
}

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (pathname === "/login") {
    const session = await getAuthenticatedDashboardUserAsync(
      request.cookies.get(DASHBOARD_SESSION_COOKIE)?.value,
    );
    if (session) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    return NextResponse.next();
  }

  if (!isProtectedPath(pathname)) {
    return NextResponse.next();
  }

  const session = await getAuthenticatedDashboardUserAsync(
    request.cookies.get(DASHBOARD_SESSION_COOKIE)?.value,
  );

  if (session) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("redirect", `${pathname}${search}`);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/", "/login", "/jobs/:path*", "/api/jobs/:path*"],
};
