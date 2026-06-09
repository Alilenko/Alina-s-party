import { NextRequest, NextResponse } from "next/server";

const PUBLIC_PATHS = ["/login", "/api/auth/login", "/api/guests/login-list"];
const STATIC_FILE = /\.(jpg|jpeg|png|gif|webp|svg|ico)$/i;

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (STATIC_FILE.test(pathname)) {
    return NextResponse.next();
  }

  const session = request.cookies.get("party_participant_id");

  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    if (session && pathname === "/login") {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  if (!session && !pathname.startsWith("/api/")) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
