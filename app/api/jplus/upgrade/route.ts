import { NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

export async function POST(request: Request) {
  try {
    const cookieHeader = request.headers.get("cookie");
    const body = await request.json();
    
    const response = await fetch(`${BACKEND_URL}/jplus/upgrade`, {
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

