
import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export default clerkMiddleware(async (auth, req) => {
  const res = NextResponse.next();

  // TODO: REMOVE THIS FOR PROD
  if (process.env.NODE_ENV !== "production") res.headers.set("Cache-Control", "no-store");

  const user = await auth();

  if (user.userId) {
    const response = fetch("localhost:3000/api/auth/user", {
      headers: { "Content-Type": "application/json" },
      method: "POST",
      body: JSON.stringify({ userID: user.userId })
    });

    console.dir(response);
  }

  return res;
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};