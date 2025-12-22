import { NextRequest, NextResponse } from "next/server";

// Helper function to get backend base URL (without /api suffix)
// In server-side Next.js, we need to connect directly to backend (internal), not through nginx
function getBackendUrl(): string {
  // Use internal backend URL (direct connection, not through nginx)
  // This is for server-side Next.js route handlers
  const internalBackend = process.env.INTERNAL_BACKEND_URL || "http://127.0.0.1:8000";
  
  // If INTERNAL_BACKEND_URL is set, use it
  if (process.env.INTERNAL_BACKEND_URL) {
    return process.env.INTERNAL_BACKEND_URL.replace(/\/api\/?$/, "");
  }
  
  // Default to localhost:8000 for internal connection
  return "http://127.0.0.1:8000";
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const backendUrl = getBackendUrl();
    
    // Build URL with query params
    const url = new URL(`${backendUrl}/api/posts`);
    searchParams.forEach((value, key) => {
      url.searchParams.set(key, value);
    });
    
    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
      signal: AbortSignal.timeout(10000), // 10 seconds timeout
    });

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json({ posts: [], total: 0 });
      }
      
      return NextResponse.json(
        { error: "Failed to fetch posts", posts: [], total: 0 },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Error fetching posts:", error);
    
    // Handle timeout
    if (error.name === "TimeoutError" || error.message?.includes("timeout")) {
      return NextResponse.json(
        { error: "Request timeout", posts: [], total: 0 },
        { status: 504 }
      );
    }
    
    return NextResponse.json({ posts: [], total: 0 });
  }
}

