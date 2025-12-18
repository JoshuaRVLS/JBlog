import { NextRequest, NextResponse } from "next/server";

const protectedRoutes = ["/dashboard", "/profile", "/feed", "/bookmarks", "/messages", "/admin", "/groupchat"]; // Add your protected routes
const publicRoutes = ["/login", "/register", "/forgot-password", "/reset-password", "/verify-email"];

export default async function middleware(req: NextRequest) {
  const accessToken = req.cookies.get("accessToken");
  const refreshToken = req.cookies.get("refreshToken");
  const path = req.nextUrl.pathname;

  // Always allow access to public routes (login, register, etc)
  // Don't redirect if user has token - let them access login page if they want to switch account
  if (publicRoutes.some(route => path.startsWith(route))) {
    return NextResponse.next();
  }

  // For protected routes, check if user has valid token
  if (protectedRoutes.some(route => path.startsWith(route))) {
    // If no tokens at all, redirect to login
    if (!accessToken && !refreshToken) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("redirect", path);
      return NextResponse.redirect(loginUrl);
    }

    // If has refresh token but no access token, allow through
    // The frontend will handle token refresh
    if (!accessToken && refreshToken) {
      return NextResponse.next();
    }

    // If has access token, allow through (validation will happen on backend)
    if (accessToken) {
      return NextResponse.next();
    }
  }

  // Allow the request to continue
  return NextResponse.next();
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

