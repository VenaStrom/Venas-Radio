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
      const normalizedId = episodeID.toString();
      const numericProgress = typeof progressNumber === "number"
        ? progressNumber
        : typeof progressNumber === "string"
          ? Number(progressNumber)
          : NaN;
      if (!normalizedId || !Number.isFinite(numericProgress)) {
        console.warn(`Skipping invalid progress entry for episodeID ${episodeID}`);
        return;
      }
      deserialized[normalizedId] = Seconds.from(numericProgress);
    });

    return deserialized;
  }
  catch (error) {
    console.error("Failed to deserialize progressDB:", error);
    return {};
  }
}