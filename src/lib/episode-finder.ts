import type { PlayStateStore } from "@/store/play-state-store";
import type { ProgressStore } from "@/store/progress-store";
import type { ContentStore } from "@/store/content-store";
import type { Content } from "@/types/api/content";

export function getNextEpisode(
  contentStore: ContentStore,
  progressStore: ProgressStore,
  playStateStore: PlayStateStore,
): Content | null {
  if (!playStateStore.currentEpisode) return null;

  const episodeData = Object.values(contentStore.contentData);

  // Sort the episodes by publish date
  episodeData.sort((a, b) => new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime());

  const episodeIDs = episodeData.map((episode) => episode.id.toString());

  // Find the index of the current episode
  const episodeIndex = episodeIDs.indexOf(playStateStore.currentEpisode.id.toString());
  if (episodeIndex === -1) return null; // Episode not found

  // Find the next episode that is not finished
  for (let i = episodeIndex + 1; i < episodeIDs.length; i++) {
    const episode = episodeData.find((episode) => episode.id.toString() === episodeIDs[i]) || null;
    if (!episode) continue;
    const isFinished = progressStore.episodeProgressMap[episode.id]?.finished;
    if (!isFinished) return episode;
  }

  return null;
};

export function getPreviousEpisode(
  contentStore: ContentStore,
  progressStore: ProgressStore,
  playStateStore: PlayStateStore,
): Content | null {
  if (!playStateStore.currentEpisode) return null;

  const episodeData = Object.values(contentStore.contentData);

  // Sort the episodes by publish date
  episodeData.sort((a, b) => new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime());

  const episodeIDs = episodeData.map((episode) => episode.id.toString());

  // Find the index of the current episode
  const episodeIndex = episodeIDs.indexOf(playStateStore.currentEpisode.id.toString());
  if (episodeIndex === -1) return null; // Episode not found

  // Find the previous episode that is not finished
  for (let i = episodeIndex - 1; i >= 0; i--) {
    const episode = episodeData.find((episode) => episode.id.toString() === episodeIDs[i]) || null;
    if (!episode) continue;
    const isFinished = progressStore.episodeProgressMap[episode.id]?.finished;
    if (!isFinished) return episode;
  }

  return null;
};