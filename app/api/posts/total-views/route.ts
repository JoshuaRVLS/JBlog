import { NextResponse } from "next/server";

// Helper function to get backend URL without double /api
function getBackendUrl(): string {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
  // Remove trailing /api if present to avoid double /api/api
  return apiUrl.replace(/\/api\/?$/, "");
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

