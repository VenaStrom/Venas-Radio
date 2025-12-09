import { ProgressDB, Seconds } from "@/types/types";

export function progressDBDeserializer(data: string | null): ProgressDB {
  if (!data) {
    console.warn("No progressDB data to deserialize.");
    return {};
  };
  try {
    const parsed = JSON.parse(data);
    const deserialized: ProgressDB = {};

    Object.entries(parsed).forEach(([episodeID, progressNumber]) => {
      if (typeof episodeID !== "string" || typeof progressNumber !== "number") {
        console.warn(`Skipping invalid progress entry for episodeID ${episodeID}`);
        return;
      }
      const id = parseInt(episodeID.toString()) as number;
      deserialized[id] = Seconds.from(parseFloat(progressNumber.toString()));
    });

    return deserialized;
  }
  catch (error) {
    console.error("Failed to deserialize progressDB:", error);
    return {};
  }
}