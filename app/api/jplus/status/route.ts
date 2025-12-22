import { NextResponse } from "next/server";

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

export async function GET(request: Request) {
  try {
    const cookieHeader = request.headers.get("cookie");
    const backendUrl = getBackendUrl();
    
    const response = await fetch(`${backendUrl}/api/jplus/status`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Cookie: cookieHeader || "",
      },
      credentials: "include",
      cache: "no-store",
    });

    if (!response.ok) {
      if (response.status === 401) {
        return NextResponse.json(
          { error: "Unauthorized" },
          { status: 401 }
        );
      }
      throw new Error(`Backend responded with ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Error fetching J+ status:", error);
    return NextResponse.json(
      { error: "Failed to fetch J+ status" },
      { status: 500 }
    );
  }
}

