import { NextRequest, NextResponse } from "next/server";
import { storeMigration } from "../migration-store";

const ALLOWED_ORIGINS = new Set([
  "https://vr-radio.tailad6f63.ts.net",
  "https://vr.venastrom.se",
  "http://localhost:3000",
]);

function withCors(request: NextRequest, response: NextResponse) {
  const origin = request.headers.get("origin");
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    response.headers.set("Access-Control-Allow-Origin", origin);
    response.headers.set("Vary", "Origin");
  }
  response.headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type");
  return response;
}

export function OPTIONS(request: NextRequest) {
  return withCors(request, new NextResponse(null, { status: 204 }));
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const payload = (body?.payload ?? {}) as Record<string, string>;

    if (!payload || typeof payload !== "object") {
      return withCors(request, NextResponse.json({ error: "Invalid payload" }, { status: 400 }));
    }

    const id = storeMigration(payload);
    return withCors(request, NextResponse.json({ id }));
  }
  catch {
    return withCors(request, NextResponse.json({ error: "Bad request" }, { status: 400 }));
  }
}
