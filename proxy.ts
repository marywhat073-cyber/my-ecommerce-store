import { NextResponse, type NextRequest } from "next/server";

const SESSION_COOKIE = "evergreen-store-session";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname === "/" || pathname === "/admin-cs-dashboard") return NextResponse.next();
  // This is only a routing hint; every account API verifies the signed session.
  if (request.cookies.has(SESSION_COOKIE)) return NextResponse.next();
  return NextResponse.redirect(new URL("/", request.url));
}

export const config = {
  matcher: ["/((?!api/|_next/static|_next/image|favicon.ico).*)"],
};
