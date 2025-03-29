
import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

console.assert(process.env.HTTPS_PUBLIC_URL, "HTTPS_PUBLIC_URL is required");

export default clerkMiddleware(async (auth, req) => {
  const res = NextResponse.next();

  // TODO: REMOVE THIS FOR PROD
  if (process.env.NODE_ENV !== "production") res.headers.set("Cache-Control", "no-store");

  
  // Ensure user is in db after clerk login
  const clerkUser = await auth();
  if (clerkUser.userId) {
    const apiResponse = await fetch(`${process.env.HTTPS_PUBLIC_URL}/api/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userId: clerkUser.userId }),
    });

    if (!apiResponse.ok) {
      console.error("Error logging in:", apiResponse.statusText);
      return res;
    }

    const _dbUser = await apiResponse.json();
  }


  return res;
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)/(.*)",
  ],
};