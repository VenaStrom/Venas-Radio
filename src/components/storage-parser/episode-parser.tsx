import { Episode, EpisodeDB } from "@/types/types";

export function episodeDBDeserializer(data: string | null): EpisodeDB {
  if (!data) return {};
  try {
    const parsed = JSON.parse(data);
    const deserialized: EpisodeDB = {};
    Object.entries(parsed).forEach(([id, episode]) => {
      // Type guard
      if (
        typeof episode !== "object"
        || episode === null
        || !("publishDate" in episode)
        || !("id" in episode)
      ) {
        console.warn(`Skipping invalid episode entry with id ${id}`);
        return;
      }
      const cleanEpisode = episode as Episode;

      deserialized[cleanEpisode.id] = {
        ...cleanEpisode,
        publishDate: new Date(cleanEpisode.publishDate),
      };
    });
    return deserialized;
  }
  catch (error) {
    console.error("Failed to deserialize episodeDB:", error);
    return {};
  }
}