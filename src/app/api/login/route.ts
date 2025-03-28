import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { randomUUID } from "node:crypto";

const client = clerkClient();

async function getUniqueUsername(baseUsername: string): Promise<string | null> {
  const makeDigits = () => Math.floor(Math.random() * 10000).toString().padStart(4, "0");

  let username = baseUsername;
  let digits = "";
  let isUnique = false;

  while (!isUnique) {
    // Check if the username exists
    const existingUser = await prisma.user.findFirst({
      where: { username },
    });

    if (!existingUser) {
      isUnique = true;
    } else {
      // Try with digits
      digits = makeDigits();
      username = `${baseUsername}#${digits}`;
    }
  }

  return username;
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json();

    // Invalid request
    if (!userId || typeof userId !== "string") {
      return NextResponse.json({ error: "Valid userId is required" }, { status: 400 });
    }

    // Get db user
    const dbUser = await prisma.user.findUnique({
      where: { id: userId },
    });
    if (dbUser) {
      // Return existing user
      return NextResponse.json({ user: dbUser }, { status: 200 });
    }

    // If user not found in db, create a new user via Clerk information

    // Get Clerk user
    const clerkUser = await (await client).users.getUser(userId);
    if (!clerkUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Create new user in db
    const suggestedUsername = clerkUser.username || clerkUser.fullName || randomUUID();
    const uniqueUsername = await getUniqueUsername(suggestedUsername);
    if (!uniqueUsername) {
      return NextResponse.json({ error: "Failed to generate a unique username" }, { status: 500 });
    }
    const newUser = await prisma.user.create({
      data: {
        id: userId,
        username: uniqueUsername,
      },
    });

    // Return new user
    return NextResponse.json({ user: newUser }, { status: 200 });

  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}