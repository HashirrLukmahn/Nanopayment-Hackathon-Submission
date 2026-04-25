import { NextResponse } from "next/server";

const API_BASE = process.env.API_BASE_URL || "http://localhost:3001";

export async function GET(_req: Request, ctx: { params: { id: string } }) {
  const res = await fetch(`${API_BASE}/v1/earnings/${encodeURIComponent(ctx.params.id)}`, {
    cache: "no-store",
  });
  const text = await res.text();
  return new NextResponse(text, {
    status: res.status,
    headers: { "Content-Type": res.headers.get("content-type") ?? "application/json" },
  });
}
