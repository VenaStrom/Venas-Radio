import { SR_Episode } from "@/types/api/episode";
import { EpisodeDB } from "@/types/types";

export async function fetchEpisodes(
  programIds: number[],
  options: {
    fromDate: Date;
    toDate: Date;
  },
): Promise<EpisodeDB> {
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

  const responses = await Promise.all(programLinks.map((link) => fetch(link).then((res) => res.json())));

  const allEpisodes: EpisodeDB = {};

  for (const data of responses) {
    data.episodes
      .filter((episode: SR_Episode) => episode.listenpodfile || episode.downloadpodfile)
      .forEach((episode: SR_Episode) => {
        allEpisodes[episode.id] = {
          id: episode.id,
          title: episode.title,
          description: episode.description,
          url: episode?.listenpodfile?.url || episode?.downloadpodfile?.url,
          program: {
            id: episode.program.id,
            name: episode.program.name,
          },
          publishDate: new Date(parseInt(episode.publishdateutc.replace(/\D/g, ""))),
          duration: episode.listenpodfile.duration || episode.downloadpodfile.duration || 0,
          image: {
            square: episode.imageurl,
            wide: episode.imageurltemplate,
          },
        };
      });
  };

  return allEpisodes;
}
