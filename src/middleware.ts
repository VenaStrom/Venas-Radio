
import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export default clerkMiddleware(async (auth, req) => {
  const res = NextResponse.next();

  // TODO: REMOVE THIS FOR PROD
  if (process.env.NODE_ENV !== "production") res.headers.set("Cache-Control", "no-store");

  const user = await auth();

  return res;
});