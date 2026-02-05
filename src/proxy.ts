import { NextRequest, NextResponse } from "next/server";
import { unproxy } from "./lib/proxy-rewrite";
import { canonURL } from "./lib/canon-url";
import sharp from "sharp";
import { clerkMiddleware } from "@clerk/nextjs/server";

export default clerkMiddleware(async (auth, req): Promise<Response> => {
  const response = NextResponse.next();

  const srResponse = await handleSRRequest(req);
  if (srResponse) {
    return srResponse;
  }

  return response;
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};

async function handleSRRequest(req: NextRequest): Promise<Response | void> {
  "use cache";

  if (!req.nextUrl.pathname.startsWith(new URL("/api/sr", canonURL).pathname)) return;

  const targetUrl = unproxy(req.nextUrl.href);
  if (!targetUrl) {
    return new Response("Bad Request: Missing 'req' query parameter", { status: 400 });
  }

  try {
    const res = await fetch(targetUrl, {
      method: req.method,
      headers: req.headers,
      body: req.method !== "GET" && req.method !== "HEAD" ? req.body : undefined,
      redirect: "manual",
    });

    // If it's an image
    const contentType = res.headers.get("content-type") || "";
    if (contentType.startsWith("image/")) {
      const newWidth = parseInt(
        req.nextUrl.searchParams.get("w")
        || req.nextUrl.searchParams.get("width")
        || "0", 10);
      const newHeight = parseInt(
        req.nextUrl.searchParams.get("h")
        || req.nextUrl.searchParams.get("height")
        || "0", 10);

      if (!newWidth && !newHeight) {
        return res;
      }
      if (isNaN(newWidth) || isNaN(newHeight)) {
        return new Response("Bad Request: Invalid width or height", { status: 400 });
      }
      if (newWidth < 0 || newHeight < 0) {
        return new Response("Bad Request: Width and height must be non-negative", { status: 400 });
      }

      const imageBuffer = await res.arrayBuffer();
      let transformer = sharp(Buffer.from(imageBuffer));

      // If original image width/height is smaller than requested, skip resizing
      if (newWidth || newHeight) {
        transformer = transformer.resize(newWidth || null, newHeight || null, {
          fit: "inside",
          withoutEnlargement: true,
        });
      }

      const transformedBuffer = await transformer.toBuffer();

      const headers = new Headers(res.headers);
      headers.set("content-length", transformedBuffer.length.toString());

      return new Response(transformedBuffer as BodyInit, {
        status: res.status,
        statusText: res.statusText,
        headers: headers,
      });
    }

    return res;
  }
  catch (error) {
    console.error(error);
    return new Response("Internal Server Error: " + (error as Error).message, { status: 500 });
  }
}