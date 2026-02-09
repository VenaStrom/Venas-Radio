import { EpisodeDB, EpisodeWithProgram, Seconds } from "@/types/types";

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
        || !("publish_date" in episode)
        || !("id" in episode)
      ) {
        console.warn(`Skipping invalid episode entry with id ${id}`);
        return;
      }
      const cleanEpisode = episode as EpisodeWithProgram;

      deserialized[cleanEpisode.id] = {
        ...cleanEpisode,
        publish_date: new Date(cleanEpisode.publish_date),
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

function decodeDuration(inputDuration: unknown): number {
  if (inputDuration instanceof Seconds) {
    return inputDuration.toNumber();
  }
  if (typeof inputDuration === "number") {
    return inputDuration;
  }
  if (typeof inputDuration === "string") {
    return Number.parseFloat(inputDuration);
  }
  if (
    typeof inputDuration === "object"
    && inputDuration !== null
    && "value" in inputDuration
    && typeof inputDuration.value === "number"
  ) {
    return inputDuration.value;
  }

  const type = typeof inputDuration;
  console.dir(inputDuration, { depth: null });
  throw new Error(`Invalid duration type: ${type}`);
}