import { NextResponse } from "next/server";

// NEXT_PUBLIC_API_URL already includes /api, so we don't need to add it again
const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

export async function GET() {
  try {
    const response = await fetch(`${BACKEND_URL}/users/locations`, {
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

