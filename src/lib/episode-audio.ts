export function getEpisodeAudioUrl(episodeId: string) {
  return `/api/episode-audio?episode_id=${encodeURIComponent(episodeId)}`;
}
