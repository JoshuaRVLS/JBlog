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

