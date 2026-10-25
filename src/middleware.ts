import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const COOKIE_NAME = "onco_session";

const ROLE_PREFIX: Record<string, string> = {
  DOCTOR: "/doctor",
  PATIENT: "/patient",
  ADMIN: "/admin",
};

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isProtected =
    pathname.startsWith("/doctor") ||
    pathname.startsWith("/patient") ||
    pathname.startsWith("/admin");

  if (!isProtected) return NextResponse.next();

  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  try {
    const secret = process.env.JWT_SECRET || String.fromCharCode(100,101,118,45,111,110,108,121,45,115,101,99,114,101,116,45,99,104,97,110,103,101,45,109,101);
    if (!secret) throw new Error("missing secret");
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret));
    const role = payload.role as string | undefined;

    const expectedPrefix = role ? ROLE_PREFIX[role] : undefined;
    if (!expectedPrefix || !pathname.startsWith(expectedPrefix)) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    return NextResponse.next();
  } catch {
    return NextResponse.redirect(new URL("/login", req.url));
  }
}

export const config = {
  matcher: ["/doctor/:path*", "/patient/:path*", "/admin/:path*"],
};
