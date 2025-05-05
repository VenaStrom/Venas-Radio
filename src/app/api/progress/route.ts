import { prisma } from "@/lib/prisma";
import { getAuth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const auth = getAuth(req);
    if (!auth.userId) {
      return new Response("Unauthorized", { status: 401 });
    }

    const { episodeId, progressMS } = await req.json() as {
      episodeId: number,
      progressMS: number
    };

    // Validate request data
    if (!auth.userId || !episodeId || progressMS === undefined) {
      return new Response("Missing required fields", { status: 400 });
    }

    await prisma.$connect();

    const progress = await prisma.episodeProgress.upsert({
      where: { userId_episodeId: { userId: auth.userId, episodeId } },
      update: { progressMS },
      create: { userId: auth.userId, episodeId, progressMS },
    });

    return new Response(JSON.stringify(progress), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });

  } catch (e) {
    console.error("Error saving progress:", e);
    return new Response("Internal server error", { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}