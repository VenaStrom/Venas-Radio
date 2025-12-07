"use client";

import ProgressBar from "@/components/progress-bar";
import PlayButton from "@/components/play-button";
import { useMemo, useState } from "react";
import { AudioPlayerMedia, PlaybackProgress, Timestamp } from "@/types/types";
import { usePlayContext } from "./play-context/play-context-use";

export default function AudioControls({ className }: { className?: string }) {
  // Local state for error handling and loading
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;

  const { currentStreamUrl, currentEpisode, currentChannel } = usePlayContext();

  const currentMedia: AudioPlayerMedia | null = useMemo(() => {
    if (!currentChannel && !currentEpisode) return null;

    const type = currentChannel ? "channel" : currentEpisode ? "episode" : null;
    if (!type) return null;

    if (type === "episode" && currentEpisode) {
      const normalizedMedia: AudioPlayerMedia = {
        type,
        episodeID: currentEpisode?.id,
        url: currentEpisode?.url,
        title: currentEpisode?.title,
        subtitle: currentEpisode?.program.name,
        image: currentEpisode?.image.square,
      };
      return normalizedMedia;
    }
    if (type === "channel" && currentChannel) {
      const normalizedMedia: AudioPlayerMedia = {
        type,
        channelID: currentChannel?.id,
        url: currentChannel?.url,
        title: currentChannel?.name,
        subtitle: currentChannel?.tagline,
        image: currentChannel?.image.square,
      };
      return normalizedMedia;
    }
    return null;
  }, [currentChannel, currentEpisode]);

  const progress = useMemo(() => {
    return new PlaybackProgress(episode.duration, progressDB[episode.id] || Seconds.from(0));
  }, [episode.id, episode.duration, progressDB]);

  const duration: Timestamp = useMemo(() => progress.durationTimestamp(), [progress]);
  const remaining: Timestamp = useMemo(() => progress.remainingTimestamp(), [progress]);
  const percent: number = useMemo(() => progress.elapsedPercentage, [progress]);

  const onProgressDrag = (event: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = parseFloat(event.target.value);
    const newTime = (inputValue / 100) * episode.duration;
  };

  return (
    <div className={`w-full flex flex-col gap-y-2 ${className || ""}`}>
      <div className="w-full">
        {/* Progress bar */}
        <ProgressBar className="block top-0" progress={percent} />

        {/* Invisible thumb to progress */}
        <input className="block top-0 w-full h-0 z-10 scale-y-150 opacity-0" type="range" min="0" max="100"
          value={percent}
          onChange={onProgressDrag} />
      </div>

      {/* Audio element */}
      <audio src={currentStreamUrl ?? undefined} preload="metadata"></audio>

      {/* Controls */}
      <div id="player" className="w-full flex flex-row justify-between items-center gap-x-3 px-3 mb-1">
        <div className="flex-1 min-w-0">
          <p className="font-light text-sm">{episodeInfo?.programName}</p>
          <p className="font-bold max-h-12 overflow-hidden text-ellipsis whitespace-break-spaces">
            {episodeInfo?.episodeTitle || "Spelar inget"}
          </p>
          {error && (
            <p className="text-xs text-red-400 mt-1">{error}</p>
          )}
          {isLoading && !error && (
            <p className="text-xs text-zinc-400 mt-1">Laddar...</p>
          )}
        </div>

        <p className="text-sm text-zinc-400 whitespace-nowrap">
          {episodeInfo ? `${episodeInfo.progress}\u00a0/\u00a0${episodeInfo.duration}` : ""}
        </p>

        <PlayButton iconSize={30} />
      </div>
    </div>
  );
}