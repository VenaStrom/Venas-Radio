import { Episode } from "@prisma/client";
import { SR_Episode } from "@/types/api/episode";

function mapSREpisode(episode: SR_Episode): Episode {
  return {
    id: episode.id.toString(),
    title: episode.title,
    description: episode.description,
    external_audio_url: episode.listenpodfile?.url || episode.downloadpodfile?.url,
    program_id: episode.program.id.toString(),
    publish_date: new Date(parseInt(episode.publishdateutc.replace(/\D/g, ""))),
    duration: episode.listenpodfile?.duration || episode.downloadpodfile?.duration || 0,
    image_square_url: episode.imageurl,
    image_wide_url: episode.imageurltemplate,
  } satisfies Episode;
}

export async function fetchEpisodes(
  programIds: number[],
  options: {
    fromDate: Date;
    toDate: Date;
  },
): Promise<Episode[]> {
  const { fromDate, toDate } = options;

  const baseURL = new URL("https://api.sr.se/api/v2/episodes/index");

  // Add common query parameters
  baseURL.searchParams.append("fromdate", fromDate.toISOString().slice(0, 10));
  baseURL.searchParams.append("todate", toDate.toISOString().slice(0, 10));
  baseURL.searchParams.append("format", "json");
  baseURL.searchParams.append("pagination", "false");
  baseURL.searchParams.append("audioquality", "high");

  // Construct program-specific links
  const programLinks = programIds.map((programID) => {
    const url = new URL(baseURL.toString());
    url.searchParams.append("programid", programID.toString());
    return url.toString();
  });

  const responses = await Promise.allSettled(
    programLinks.map(async (link) => {
      try {
        const res = await fetch(link);
        if (!res.ok) return null;
        return (await res.json()) as { episodes?: SR_Episode[] };
      } catch (error) {
        console.error(error);
        return null;
      }
    }),
  );

  const fetchedEpisodes: Episode[] = [];
  for (const response of responses) {
    if (response.status !== "fulfilled") continue;
    const data = response.value;
    if (!data?.episodes) continue;
    data.episodes
      .filter((episode: SR_Episode) => episode.listenpodfile || episode.downloadpodfile)
      .forEach((episode: SR_Episode) => {
        fetchedEpisodes.push(mapSREpisode(episode));
      });
  }

  return fetchedEpisodes;
}

export async function fetchEpisodeById(episodeId: string): Promise<Episode | null> {
  const baseURL = new URL("https://api.sr.se/api/v2/episodes/get");
  baseURL.searchParams.append("id", episodeId);
  baseURL.searchParams.append("format", "json");
  baseURL.searchParams.append("audioquality", "high");

  const response = await fetch(baseURL.toString());
  if (!response.ok) return null;

  const data = (await response.json()) as { episode?: SR_Episode };
  if (!data?.episode) return null;
  if (!data.episode.listenpodfile && !data.episode.downloadpodfile) return null;

  return mapSREpisode(data.episode);
}
