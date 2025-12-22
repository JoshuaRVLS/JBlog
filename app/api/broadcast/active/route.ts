import { NextResponse } from "next/server";

// Helper function to get backend base URL (without /api suffix)
// In server-side Next.js, we need absolute URLs, not relative paths
function getBackendUrl(): string {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://jblog.space";
  
  // If NEXT_PUBLIC_API_URL is a relative path like "/api", use SITE_URL as base
  if (apiUrl && apiUrl.startsWith("/")) {
    return siteUrl;
  }
  
  // If NEXT_PUBLIC_API_URL is a full URL, remove /api suffix
  if (apiUrl && (apiUrl.startsWith("http://") || apiUrl.startsWith("https://"))) {
    return apiUrl.replace(/\/api\/?$/, "");
  }
  
  // Fallback: use NEXT_PUBLIC_SITE_URL
  return siteUrl;
}

export async function GET() {
  try {
    const backendUrl = getBackendUrl();
    const response = await fetch(`${backendUrl}/api/broadcast/active`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return NextResponse.json({ broadcast: null });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Error fetching broadcast:", error);
    return NextResponse.json({ broadcast: null });
  }
}

