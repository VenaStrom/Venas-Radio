import { NextRequest, NextResponse } from "next/server";
import { loadMigration } from "../migration-store";

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
  response.headers.set("Access-Control-Allow-Methods", "GET, OPTIONS");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type");
  return response;
}

export function OPTIONS(request: NextRequest) {
  return withCors(request, new NextResponse(null, { status: 204 }));
}

export function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return withCors(request, NextResponse.json({ error: "Missing id" }, { status: 400 }));
  }

  const payload = loadMigration(id);
  if (!payload) {
    return withCors(request, NextResponse.json({ error: "Not found" }, { status: 404 }));
  }

  return withCors(request, NextResponse.json({ payload }));
}
