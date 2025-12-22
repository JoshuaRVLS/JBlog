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

