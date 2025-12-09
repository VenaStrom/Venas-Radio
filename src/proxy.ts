import { NextRequest, NextResponse } from "next/server";
import { unproxy } from "./lib/proxy-rewrite";
import { canonURL } from "./lib/canon-url";

export default async function proxy(req: NextRequest): Promise<Response> {
  const response = NextResponse.next();

  if (req.nextUrl.pathname.startsWith(new URL("/api/sr", canonURL).pathname)) {
    const targetUrl = unproxy(req.nextUrl.href);
    if (!targetUrl) {
      return new Response("Bad Request: Missing 'req' query parameter", { status: 400 });
    }

    return NextResponse.rewrite(targetUrl);
  }

  return response;
}