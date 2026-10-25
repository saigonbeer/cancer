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
    const secret = process.env.JWT_SECRET;
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
