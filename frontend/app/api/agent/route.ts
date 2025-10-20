import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Forward to backend service (keep backend untouched)
    const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3002";
    const res = await fetch(`${BACKEND_URL}/agent`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const text = await res.text();
    return new NextResponse(text, { status: res.status });
  } catch (err: any) {
    return new NextResponse(err?.message || "Internal error", { status: 500 });
  }
}
