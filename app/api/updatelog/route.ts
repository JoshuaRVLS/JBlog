import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = searchParams.get("limit") || "10";
    const cursor = searchParams.get("cursor") || undefined;
    
    const url = new URL(`${BACKEND_URL}/updatelog/`);
    url.searchParams.set("limit", limit);
    if (cursor) {
      url.searchParams.set("cursor", cursor);
    }
    
    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return NextResponse.json({ logs: [], pagination: { hasMore: false } });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Error fetching update logs:", error);
    return NextResponse.json({ logs: [], pagination: { hasMore: false } });
  }
}

