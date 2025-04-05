import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { userId, episodeId, progress } = await req.json();

    // Validate request
    if (!userId || !episodeId || typeof progress !== "number") {
      return new Response("Invalid request", { status: 400 });
    }

    // Update or create progress in the database
    const updatedProgress = await prisma.episodeProgress.upsert({
      where: {
        userId_episodeId: {
          userId,
          episodeId,
        },
      },
      update: { progress },
      create: { userId, episodeId, progress },
    });

    return new Response(JSON.stringify(updatedProgress), { status: 200 });
  } catch (error) {
    console.error("Error updating progress:", error);
    return new Response("Internal server error", { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const { userId, episodeId } = await req.json();

    // Validate request
    if (!userId || !episodeId) {
      return new Response("Invalid request", { status: 400 });
    }

    // Fetch progress from the database
    const progress = await prisma.episodeProgress.findUnique({
      where: {
        userId_episodeId: {
          userId,
          episodeId,
        },
      },
    });

    return new Response(JSON.stringify(progress), { status: 200 });
  } catch (error) {
    console.error("Error fetching progress:", error);
    return new Response("Internal server error", { status: 500 });
  }
}