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

