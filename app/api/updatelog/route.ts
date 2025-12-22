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
    const limit = searchParams.get("limit") || "10";
    const cursor = searchParams.get("cursor") || undefined;
    const backendUrl = getBackendUrl();
    
    const url = new URL(`${backendUrl}/api/updatelog/`);
    url.searchParams.set("limit", limit);
    if (cursor) {
      url.searchParams.set("cursor", cursor);
    }
    
    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return NextResponse.json({ logs: [], pagination: { hasMore: false } });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Error fetching update logs:", error);
    return NextResponse.json({ logs: [], pagination: { hasMore: false } });
  }
}

