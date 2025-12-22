import { NextResponse } from "next/server";

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

export async function GET() {
  try {
    const backendUrl = getBackendUrl();
    const response = await fetch(`${backendUrl}/api/users/locations`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      // If backend returns 404, return empty data instead of error
      if (response.status === 404) {
        return NextResponse.json({
          locations: [],
          totalUsers: 0,
        });
      }
      
      return NextResponse.json(
        { error: "Failed to fetch locations", locations: [], totalUsers: 0 },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    // Handle network errors (backend not running, connection refused, etc.)
    console.error("Error fetching locations:", error);
    
    // Return empty data instead of error to prevent UI breaking
    return NextResponse.json({
      locations: [],
      totalUsers: 0,
    });
  }
}

