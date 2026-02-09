import { Episode } from "@prisma/client";
import { SR_Episode } from "@/types/api/episode";

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

  const responses = await Promise.all(
    programLinks.map((link) => fetch(link)
      .then((res) => res.json())
      .catch(e => console.error(e))
    ),
  );

  const fetchedEpisodes: Episode[] = [];
  for (const data of responses) {
    data.episodes
      .filter((episode: SR_Episode) => episode.listenpodfile || episode.downloadpodfile)
      .forEach((episode: SR_Episode) => {
        fetchedEpisodes.push({
          id: episode.id.toString(),
          title: episode.title,
          description: episode.description,
          external_audio_url: episode.listenpodfile?.url || episode.downloadpodfile?.url,
          program_id: episode.program.id.toString(),
          publish_date: new Date(parseInt(episode.publishdateutc.replace(/\D/g, ""))),
          duration: episode.listenpodfile.duration || episode.downloadpodfile.duration,
          image_square_url: episode.imageurl,
          image_wide_url: episode.imageurltemplate,
        } satisfies Episode);
      });
  };

  return fetchedEpisodes;
}
