import { getDateFromString } from "@/lib/date-extractor";
import { prisma } from "@/lib/prisma";
import { SR_API } from "@/types";
import { currentUser } from "@clerk/nextjs/server";
import { Episode, PodFile, Program, User } from "@prisma/client";

async function fetchEpisodes(program: Program, config: User) {
  // Fetch episodes
  const fromDate = new Date(Date.now() - config.fetchSpan * 86400000);
  const toDate = new Date(Date.now() + 1 * 86400000); // 1 day ahead to include today
  const toFormattedDate = (date: Date) => date.toLocaleDateString();
  const args = `programid=${program.id}&fromdate=${toFormattedDate(fromDate)}&todate=${toFormattedDate(toDate)}&${process.env.API_COMMON_ARGS}`;
  const url = `${process.env.API_EPISODE_URL}?${args}`;

  const response = await fetch(url);
  if (!response.ok) {
    console.error(`Failed to fetch episodes for program ${program.name} (${program.id}): ${response.statusText}`);
    return;
  }
  const episodesData: SR_API.Episode[] = (await response.json()).episodes;

  if (!episodesData || !Array.isArray(episodesData)) {
    console.error(`Invalid response format for program ${program.name} (${program.id})`);
    return;
  }
  if (episodesData.length === 0) {
    console.info(`No episodes found for program ${program.name} (${program.id})`);
    return;
  }

  // Map episode data
  // Determine if it's a podfile or broadcast
  const typedEpisodes: (Episode | null)[] = episodesData.map(episode => {
    const broadcastEpisode = !!episode.broadcast || !episode.listenpodfile;
    const podfileEpisode = !!episode.listenpodfile && !episode.broadcast;

    if (broadcastEpisode && podfileEpisode) {
      // TODO: WTF? The api shouldn't return this
      console.error(`Episode ${episode.id} (${episode.title}) has both broadcast and podfile data`);
      return null;
    }
    else if (broadcastEpisode) {
      // TODO: Handle broadcast episodes
      return null;
    }
    else if (podfileEpisode) {
      return {
        id: episode.id,
        title: episode.title,
        description: episode.description,
        image: episode.imageurl,
        imageHD: episode.imageurltemplate,
        channelId: episode.channelid || null,
        programId: episode.program.id,
        publishDateUTC: getDateFromString(episode.publishdateutc),
      } as Episode;
    }

    console.error(`Episode ${episode.id} (${episode.title}) is neither a podfile nor a broadcast`);
    return null;
  })
    .filter(Boolean);

  return typedEpisodes;
}

export default async function FeedPage() {
  const userId = (await currentUser())?.id;
  if (!userId) return <main>Unauthorized</main>;

  const dbUser = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      programs: {
        include: { episodes: true },
      },
    },
  });

  if (!dbUser) return <main>User not found</main>;

  dbUser.programs.forEach(async (program) => {
    // TODO: DB caching

    const episodes = await fetchEpisodes(program, dbUser);

    console.debug(episodes);
  });

  return (<main>
    inloggad
  </main>);
}