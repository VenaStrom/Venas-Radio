import { Episode, EpisodeDB, Seconds } from "@/types/types";

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
        duration: decodeDuration(cleanEpisode.duration),
      };
    });
    return deserialized;
  }
  catch (error) {
    console.error("Failed to deserialize episodeDB:", error);
    return {};
  }
}

function decodeDuration(inputDuration: unknown): Seconds {
  if (inputDuration instanceof Seconds) {
    return inputDuration;
  }
  if (typeof inputDuration === "number") {
    return new Seconds(inputDuration);
  }
  if (typeof inputDuration === "string") {
    return new Seconds(parseFloat(inputDuration));
  }
  if (
    typeof inputDuration === "object"
    && inputDuration !== null
    && "value" in inputDuration
    && typeof inputDuration.value === "number"
  ) {
    return new Seconds(inputDuration.value);
  }

  const type = typeof inputDuration;
  console.dir(inputDuration, { depth: null });
  throw new Error(`Invalid duration type: ${type}`);
}