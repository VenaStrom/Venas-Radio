import { NextRequest, NextResponse } from "next/server";
import { unproxy } from "./lib/proxy-rewrite";

export default function proxy(req: NextRequest) {
  const response = NextResponse.next();

  if (req.nextUrl.pathname.startsWith("/api/sr")) {
    const targetUrl = unproxy(req.nextUrl.href);
    if (targetUrl) {
      return NextResponse.rewrite(targetUrl);
    }
    else {
      return new Response("Bad Request: Missing 'req' query parameter", { status: 400 });
    }
  }

  return response;
}