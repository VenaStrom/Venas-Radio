"use client";

import ProgressBar from "@/components/progress-bar";
import PlayButton from "@/components/play-button";
import { useMemo, useState } from "react";
import { AudioPlayerMedia, PlaybackProgress, Seconds, Timestamp } from "@/types/types";
import { usePlayContext } from "./play-context/play-context-use";

export default function AudioControls({ className }: { className?: string }) {
  // Local state for error handling and loading
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;

  const { currentStreamUrl, currentEpisode, currentChannel, progressDB, setCurrentProgress } = usePlayContext();

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

  const progress: PlaybackProgress | null = useMemo(() => {
    if (currentMedia?.type === "episode" && currentEpisode) {
      return new PlaybackProgress(currentEpisode.duration, progressDB[currentEpisode.id] || Seconds.from(0));
    }
    return null;
  }, [currentMedia?.type, currentEpisode, progressDB]);

  const duration: Timestamp | null = useMemo(() => progress ? progress.durationTimestamp() : null, [progress]);
  const elapsed: Timestamp | null = useMemo(() => progress ? progress.elapsedTimestamp() : null, [progress]);
  const percent: number | null = useMemo(() => progress ? progress.elapsedPercentage : null, [progress]);

  const onProgressDrag = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (currentMedia?.type === "channel") return; // No seeking for live channels

    const inputValue = parseFloat(event.target.value);
    if (progress && currentEpisode) {
      const newElapsed = Seconds.from(Math.round((inputValue / 100) * progress.duration.toNumber()));
      setCurrentProgress(newElapsed);
    }
  };

  return (
    <div className={`w-full flex flex-col gap-y-2 ${className || ""}`}>
      <div className="w-full">
        {/* Progress bar */}
        <ProgressBar
          className="block top-0"
          progress={percent ?? 100}
          innerClassName={currentMedia?.type === "channel" ? "animate-pulse" : ""}
        />

        {/* Invisible thumb to progress */}
        <input
          className="block top-0 w-full h-0 z-10 scale-y-150 opacity-0"
          type="range" min="0" max="100"
          value={percent ?? 100}
          onChange={onProgressDrag} />
      </div>

      {/* Audio element */}
      <audio src={currentStreamUrl ?? undefined}></audio>

      {/* Controls */}
      <div id="player" className="w-full flex flex-row justify-between items-center gap-x-3 px-3 mb-1">
        <div className="flex-1 min-w-0">
          <p className="font-light text-sm">{currentMedia?.subtitle}</p>
          <p className="font-bold max-h-12 overflow-hidden text-ellipsis whitespace-break-spaces">
            {currentMedia?.title || "Spelar inget"}
          </p>
          {error && (
            <p className="text-xs text-red-400 mt-1">{error}</p>
          )}
          {isLoading && !error && (
            <p className="text-xs text-zinc-400 mt-1">Laddar...</p>
          )}
        </div>

        <p className="text-sm text-zinc-400 whitespace-nowrap">
          {!elapsed || !duration
            ? "--:--/--:--"
            : currentMedia?.type === "channel"
              ? "Live"
              : `${elapsed.toString()}/${duration.toString()}`
          }
        </p>

        <PlayButton iconSize={30} />
      </div>
    </div>
  );
}