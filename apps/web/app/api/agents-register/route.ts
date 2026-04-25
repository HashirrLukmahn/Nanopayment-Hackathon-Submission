import { NextResponse } from "next/server";

const API_BASE = process.env.API_BASE_URL || "http://localhost:3001";

export async function POST(req: Request) {
  const body = await req.text();
  const res = await fetch(`${API_BASE}/v1/agents/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });
  const text = await res.text();
  return new NextResponse(text, {
    status: res.status,
    headers: { "Content-Type": res.headers.get("content-type") ?? "application/json" },
  });
}
