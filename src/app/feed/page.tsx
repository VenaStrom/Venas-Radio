import type { Episode, SR_API } from "@/types";
import type { Program, User } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { getDateFromString } from "@/lib/date-extractor";
import { EpisodeElement } from "@/components/episode-element";
import { sortMap } from "@/lib/episode-sorters";
import React from "react";

async function fetchEpisodes(program: Program, config: User): Promise<Episode[] | null> {
  // Fetch episodes
  const fromDate = new Date(Date.now() - config.fetchSpan * 86400000);
  const toDate = new Date(Date.now() + 1 * 86400000); // 1 day ahead to include today
  const toFormattedDate = (date: Date) => date.toLocaleDateString();
  const args = `programid=${program.id}&fromdate=${toFormattedDate(fromDate)}&todate=${toFormattedDate(toDate)}&${process.env.API_COMMON_ARGS}`;
  const url = `${process.env.API_EPISODE_URL}?${args}`;

  const response = await fetch(url);
  if (!response.ok) {
    console.error(`Failed to fetch episodes for program ${program.name} (${program.id}): ${response.statusText}`);
    return null;
  }
  const episodesData: SR_API.Episode[] = (await response.json()).episodes;

  if (!episodesData || !Array.isArray(episodesData)) {
    console.error(`Invalid response format for program ${program.name} (${program.id})`);
    return null;
  }
  if (episodesData.length === 0) {
    console.info(`No episodes found for program ${program.name} (${program.id})`);
    return null;
  }

  // Map episode data
  // Determine if it's a podfile or broadcast
  const typedEpisodes: Episode[] = episodesData.map(episode => {
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
      const pod: SR_API.PodEpisode = episode as SR_API.PodEpisode;
      return {
        id: pod.id,
        title: pod.title,
        description: pod.description,
        imageSquare: pod.imageurl,
        imageWideHD: pod.imageurltemplate,
        channelId: pod.channelid || null,
        programId: pod.program.id,
        program: program,
        publishDateUTC: getDateFromString(pod.publishdateutc),
        podfile: {
          id: episode.id, // Use the episode ID as the podfile ID since they are one to one
          title: pod.listenpodfile.title,
          description: pod.listenpodfile.description,
          url: pod.listenpodfile.url,
          duration: pod.listenpodfile.duration,
          fileSizeInBytes: pod.listenpodfile.filesizeinbytes,
          programId: pod.listenpodfile.program.id,
          publishDateUTC: getDateFromString(pod.listenpodfile.publishdateutc),
        },
      } as Episode;
    }

    console.error(`Episode ${episode.id} (${episode.title}) is neither a podfile nor a broadcast`);
    return null;
  })
    .filter(Boolean) as Episode[]; // Filter out null values

  return typedEpisodes;
}

export default async function FeedPage() {
  const userId = (await currentUser())?.id;
  if (!userId) return <main>Unauthorized</main>;

  const dbUser = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      progress: true,
      programs: true,
    },
  });

  if (!dbUser) return <main>User not found</main>;

  const episodesData: Episode[] = [];

  const episodeFetchers = dbUser.programs.map(program =>
    new Promise<Episode[]>(async (resolve, reject) => {
      const fetchedEpisodes = await fetchEpisodes(program, dbUser);

      if (!fetchedEpisodes) {
        console.warn(`No episodes found for program ${program.name} (${program.id})`);
        resolve([]);
        return;
      };

      episodesData.push(...fetchedEpisodes);

      resolve(fetchedEpisodes);
    })
  );

  await Promise.all(episodeFetchers);

  // Write the episodes to the database
  await Promise.all(episodesData.map(async (episode) => {
    try {
      // First create the podfile
      await prisma.podfile.upsert({
        where: { id: episode.podfile.id },
        update: {
          title: episode.podfile.title,
          description: episode.podfile.description,
          duration: episode.podfile.duration,
          fileSizeInBytes: episode.podfile.fileSizeInBytes,
          publishDateUTC: episode.podfile.publishDateUTC,
          url: episode.podfile.url,
          programId: episode.podfile.programId
        },
        create: {
          id: episode.podfile.id,
          title: episode.podfile.title,
          description: episode.podfile.description,
          duration: episode.podfile.duration,
          fileSizeInBytes: episode.podfile.fileSizeInBytes,
          publishDateUTC: episode.podfile.publishDateUTC,
          url: episode.podfile.url,
          programId: episode.podfile.programId
        }
      });

      // Then create the episode (which references the podfile)
      await prisma.episode.upsert({
        where: { id: episode.id },
        update: {
          title: episode.title,
          description: episode.description,
          imageSquare: episode.imageSquare,
          imageWideHD: episode.imageWideHD,
          publishDateUTC: episode.publishDateUTC,
          programId: episode.programId,
          channelId: episode.channelId,
        },
        create: {
          title: episode.title,
          description: episode.description,
          imageSquare: episode.imageSquare,
          imageWideHD: episode.imageWideHD,
          publishDateUTC: episode.publishDateUTC,
          podfile: {
            connect: { id: episode.podfile.id }
          },
        }
      });
    } catch (error) {
      console.error(`Failed to save episode ${episode.id}:`, error);
    }
  }));

  return (
    <main className="px-0">
      <ul className="mx-5 flex flex-col gap-y-9 first:pt-4 last:pb-10">
        {episodesData
          // Sort episodes based on user preference
          .sort(sortMap[dbUser.feedSort])
          // Determine if there should be a date line between episodes
          .map((episodeData, i) => {
            if (dbUser.feedSort !== "OLDEST_PER_DAY") return { episodeData, dayBreak: null };

            const nextEpisode: Episode | undefined = episodesData[i + 1];
            if (!nextEpisode) return { episodeData, dayBreak: null };

            // Add a date separator for each day
            const thisDate = episodeData.publishDateUTC.toISOString().slice(0, 10);
            const nextDate = nextEpisode.publishDateUTC.toISOString().slice(0, 10);
            if (thisDate !== nextDate) return { episodeData, dayBreak: new Date(nextDate) };

            return { episodeData, dayBreak: null };
          })
          // Make the episodes
          .map((data, i) => {
            return (
              <React.Fragment key={i}>
                <EpisodeElement
                  key={"episode" + i}
                  userId={dbUser.id}
                  episode={data.episodeData}
                  progress={dbUser.progress.find(p => p.episodeId === data.episodeData.id) || null}
                />

                {/* If theres a day break, add a line with the date */}
                {data.dayBreak && (
                  <div className="text-sm font-bold text-zinc-500" key={"dateLine" + i}>
                    {data.dayBreak.toLocaleDateString("sv-SE", { weekday: "long", month: "long", day: "2-digit" })}
                  </div>
                )}
              </React.Fragment>
            );
          })
        }
      </ul>
    </main>
  );
}