import { prisma } from "@/lib/prisma";

/** 
 * Return episode object from database
 */
export async function POST(req: Request) {
  try {
    const { episodeId } = await req.json();

    // Validate request
    if (!episodeId) {
      return new Response("Invalid request", { status: 400 });
    }

    // Fetch episode from the database
    const episode = await prisma.episode.findUnique({
      where: {
        id: episodeId,
      },
      include: {
        program: true,
        podfile: true,
      },
    });

    return new Response(JSON.stringify(episode), { status: 200 });
  }
  catch (e) {
    console.error("Error fetching episode:", e);
    return new Response("Internal server error", { status: 500 });
  }
}