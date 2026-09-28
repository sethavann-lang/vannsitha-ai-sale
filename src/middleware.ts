import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken, COOKIE_NAME } from "@/lib/auth";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1. Next.js static assets & root metadata files & public media
  if (
    pathname.startsWith("/_next/") ||
    pathname.match(/\.(png|jpg|jpeg|gif|svg|ico|webp)$/) ||
    pathname === "/favicon.ico" ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml"
  ) {
    return NextResponse.next();
  }

  // 2. Strict Public API Whitelist (Meta webhook + auth endpoints)
  const isPublicApi =
    pathname === "/api/auth/login" ||
    pathname === "/api/auth/logout" ||
    pathname === "/api/auth/me" ||
    pathname === "/api/webhook";

  // 3. Strict Public Page Whitelist (Login + Meta App Review Privacy Policy)
  const isPublicPage = pathname === "/login" || pathname === "/privacy";

  // Check session
  const token = req.cookies.get(COOKIE_NAME)?.value;
  const session = await verifySessionToken(token);

  // If already authenticated and visiting /login, redirect to /
  if (pathname === "/login" && session.valid) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  // Allow public API or public Page
  if (isPublicApi || isPublicPage) {
    return NextResponse.next();
  }

  // Allow authenticated requests
  if (session.valid) {
    return NextResponse.next();
  }

  // FAIL CLOSED FOR ALL OTHER PATHS:
  // Unauthorized API routes return 401 Unauthorized JSON
  if (pathname.startsWith("/api/")) {
    return NextResponse.json(
      { error: "Unauthorized: សូមចូលប្រព័ន្ធជាមុនសិន" },
      { status: 401 }
    );
  }

  // Unauthorized Page routes redirect cleanly to /login
  return NextResponse.redirect(new URL("/login", req.url));
}

export const config = {
  matcher: [
    /*
     * Match all request paths except _next/static, _next/image, and static files
     */
    "/((?!_next/static|_next/image|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp)$).*)",
  ],
};
