export function getEpisodeAudioUrl(episodeId: string) {
  return `/api/episode-audio?episode_id=${encodeURIComponent(episodeId)}`;
}

export function getContinuousStreamUrl(episodeIds: string[]) {
  return `/api/continuous-stream?episode_ids=${episodeIds.map(encodeURIComponent).join(",")}`;
}
