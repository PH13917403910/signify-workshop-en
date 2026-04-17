import { NextRequest, NextResponse } from "next/server";

const PUBLIC_PATHS = ["/access", "/admin"];
const ASSET_PREFIXES = ["/_next", "/favicon.ico", "/socket.io"];
const COOKIE_NAME = "workshop-access";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/")) ||
    ASSET_PREFIXES.some((p) => pathname.startsWith(p))
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (token === "granted") {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  url.pathname = "/access";
  url.searchParams.set("next", pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
