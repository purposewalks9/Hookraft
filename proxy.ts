import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const COOKIE_NAME = "early-access";

export function proxy(request: NextRequest) {
  if (process.env.EARLY_ACCESS_ENABLED !== "true") {
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl;

  const hasAccess = request.cookies.get(COOKIE_NAME)?.value === "granted";

  if (pathname === "/access" && hasAccess) {
    return NextResponse.redirect(new URL("/docs/introduction", request.url));
  }

  // skip for these paths
  if (
    pathname.startsWith("/access") ||
    pathname.startsWith("/api/access") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  if (!hasAccess) {
    return NextResponse.redirect(new URL("/access", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
