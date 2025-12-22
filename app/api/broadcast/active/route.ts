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

