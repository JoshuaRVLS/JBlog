import { NextResponse } from "next/server";

// Helper function to get backend base URL (without /api suffix)
function getBackendUrl(): string {
  // If NEXT_PUBLIC_API_URL is set, use it and remove /api suffix
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL.replace(/\/api\/?$/, "");
  }
  
  // Fallback: use NEXT_PUBLIC_SITE_URL or construct from current origin
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (siteUrl) {
    return siteUrl;
  }
  
  // Development fallback
  return "http://localhost:8000";
}

export async function GET() {
  try {
    const backendUrl = getBackendUrl();
    const response = await fetch(`${backendUrl}/api/posts/total-views`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      // If backend returns 404, return default value instead of error
      if (response.status === 404) {
        return NextResponse.json({
          totalViews: 0,
        });
      }
      
      return NextResponse.json(
        { error: "Failed to fetch total views", totalViews: 0 },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    // Handle network errors (backend not running, connection refused, etc.)
    console.error("Error fetching total views:", error);
    
    // Return default value instead of error to prevent UI breaking
    return NextResponse.json({
      totalViews: 0,
    });
  }
}

