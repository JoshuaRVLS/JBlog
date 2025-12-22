import { NextRequest, NextResponse } from "next/server";

const protectedRoutes = ["/dashboard", "/profile", "/feed", "/bookmarks", "/messages", "/admin", "/groupchat"];
const publicRoutes = ["/login", "/register", "/forgot-password", "/reset-password", "/verify-email"];

export default async function middleware(req: NextRequest) {
  const accessToken = req.cookies.get("accessToken");
  const refreshToken = req.cookies.get("refreshToken");
  const path = req.nextUrl.pathname;

  // Create response
  const response = NextResponse.next();

  // Add performance headers for all requests
  response.headers.set("X-DNS-Prefetch-Control", "on");
  response.headers.set("X-Frame-Options", "SAMEORIGIN");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "origin-when-cross-origin");

  // Cache static assets aggressively
  if (path.startsWith("/_next/static")) {
    response.headers.set("Cache-Control", "public, max-age=31536000, immutable");
  }

  // Cache optimized images
  if (path.startsWith("/_next/image")) {
    response.headers.set("Cache-Control", "public, max-age=31536000, immutable");
  }

  // Always allow access to public routes
  if (publicRoutes.some(route => path.startsWith(route))) {
    return response;
  }

  // For protected routes, check if user has valid token
  if (protectedRoutes.some(route => path.startsWith(route))) {
    if (!accessToken && !refreshToken) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("redirect", path);
      return NextResponse.redirect(loginUrl);
    }

    if (!accessToken && refreshToken) {
      return response;
    }

    if (accessToken) {
      return response;
    }
  }

  return response;
}

// Configure which routes this middleware runs on
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

