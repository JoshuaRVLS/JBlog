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

export async function POST(request: Request) {
  try {
    const cookieHeader = request.headers.get("cookie");
    const body = await request.json();
    const backendUrl = getBackendUrl();
    
    const response = await fetch(`${backendUrl}/api/jplus/upgrade`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: cookieHeader || "",
      },
      credentials: "include",
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        errorData,
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Error upgrading to J+:", error);
    return NextResponse.json(
      { error: "Failed to upgrade to J+" },
      { status: 500 }
    );
  }
}

