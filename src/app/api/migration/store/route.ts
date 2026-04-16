import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { storeMigration } from "../migration-store";
import type { JSONValue } from "@/types";

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
    const body = await request.json() as JSONValue;
    if (!body || typeof body !== "object") {
      return withCors(request, NextResponse.json({ error: "Invalid JSON body" }, { status: 400 }));
    }
    if (!("payload" in body)) {
      return withCors(request, NextResponse.json({ error: "Missing payload" }, { status: 400 }));
    }
    const payload = body["payload"];

    if (
      !payload
      || typeof payload !== "object"
      || Array.isArray(payload)
      || Object.values(payload).some(value => typeof value !== "string")
    ) {
      return withCors(request, NextResponse.json({ error: "Invalid payload" }, { status: 400 }));
    }

    const payloadRecord: Record<string, string> = {};
    for (const [key, value] of Object.entries(payload)) {
      if (typeof value === "string") {
        payloadRecord[key] = value;
      } else {
        return withCors(request, NextResponse.json({ error: "Invalid payload values" }, { status: 400 }));
      }
    }

    const id = storeMigration(payloadRecord);
    return withCors(request, NextResponse.json({ id }));
  }
  catch {
    return withCors(request, NextResponse.json({ error: "Bad request" }, { status: 400 }));
  }
}
