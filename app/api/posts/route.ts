import { NextRequest, NextResponse } from "next/server";

// Helper function to get backend URL without double /api
function getBackendUrl(): string {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
  // Remove trailing /api if present to avoid double /api/api
  return apiUrl.replace(/\/api\/?$/, "");
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

