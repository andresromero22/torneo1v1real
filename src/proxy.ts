import { NextRequest, NextResponse } from "next/server";
import { COOKIE_NAME, getSessionToken } from "@/lib/auth";

export async function proxy(request: NextRequest) {
  // /admin itself renders the login form when unauthenticated, so only the
  // nested routes need a hard redirect gate here.
  if (request.nextUrl.pathname === "/admin") {
    return NextResponse.next();
  }

  const cookie = request.cookies.get(COOKIE_NAME)?.value;
  const expected = await getSessionToken();

  if (cookie !== expected) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
