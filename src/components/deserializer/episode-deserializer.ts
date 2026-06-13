import { isEpisodeWithProgram } from "@/types";
import type { EpisodeDB, JSONValue } from "@/types/types";
import { Seconds } from "@/types/types";

export function episodeDBDeserializer(data: string | null): EpisodeDB {
  if (!data) return {};
  try {
    const parsed = JSON.parse(data) as JSONValue;

    if (
      !parsed
      || typeof parsed !== "object"
      || Array.isArray(parsed)
    ) {
      console.warn("Invalid episodeDB format. Expected an object with episodeID keys and episode data values.");
      return {};
    }

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
      if (!isEpisodeWithProgram(episode)) {
        console.warn(`Skipping episode entry with id ${id} due to missing program data`);
        return;
      }

      deserialized[episode.id] = {
        ...episode,
        publish_date: new Date(episode.publish_date),
        duration: decodeDuration(episode.duration),
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