import { NextResponse } from "next/server";

// Helper function to get backend URL without double /api
function getBackendUrl(): string {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
  // Remove trailing /api if present to avoid double /api/api
  return apiUrl.replace(/\/api\/?$/, "");
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

