import { NextRequest, NextResponse } from "next/server";

// Helper function to get backend base URL (without /api suffix)
function getBackendUrl(): string {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  
  // If NEXT_PUBLIC_API_URL is a relative path like "/api", use SITE_URL as base
  if (apiUrl && apiUrl.startsWith("/")) {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://jblog.space";
    return siteUrl;
  }
  
  // If NEXT_PUBLIC_API_URL is a full URL, remove /api suffix
  if (apiUrl && (apiUrl.startsWith("http://") || apiUrl.startsWith("https://"))) {
    return apiUrl.replace(/\/api\/?$/, "");
  }
  
  // Fallback: use NEXT_PUBLIC_SITE_URL
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (siteUrl) {
    return siteUrl;
  }
  
  // Development fallback
  return "http://localhost:8000";
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

