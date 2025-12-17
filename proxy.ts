import { NextRequest, NextResponse } from "next/server";

const protectedRoutes = ["/dashboard", "/profile", "/feed", "/bookmarks", "/messages", "/admin"]; // Add your protected routes
const publicRoutes = ["/login", "/register"];

export default function middleware(req: NextRequest) {
  const accessToken = req.cookies.get("accessToken");
  const path = req.nextUrl.pathname;


  // If user is on a public route (login/register) and has a token, redirect to home (not dashboard)
  if (publicRoutes.includes(path) && accessToken) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  // If user is on a protected route and doesn't have a token, redirect to login
  if (protectedRoutes.some(route => path.startsWith(route)) && !accessToken) {
    return NextResponse.redirect(new URL("/login", req.url));
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
