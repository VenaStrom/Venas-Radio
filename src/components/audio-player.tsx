"use client";

import ProgressBar from "@/components/progress-bar";
import PlayButton from "@/components/play-button";
import { useEffect, useMemo, useRef, useState } from "react";
import { AudioPlayerMedia, PlaybackProgress, Seconds, Timestamp } from "@/types/types";
import { usePlayContext } from "./play-context/play-context-use";
import { useDebounce } from "use-debounce";

export default function AudioControls({ className }: { className?: string }) {
  // Local state for error handling and loading
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;

  const {
    isPlaying,
    currentStreamUrl,
    currentEpisode,
    currentChannel,
    progressDB,
    setCurrentProgress,
  } = usePlayContext();

  // Normalized media that abstracts episode and channel to the audio player
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
        subtitle: currentChannel.channelType,
        image: currentChannel?.image.square,
      };
      return normalizedMedia;
    }
    return null;
  }, [currentChannel, currentEpisode]);

  // Playback progress class instance
  const progress: PlaybackProgress | null = useMemo(() => {
    if (currentMedia?.type === "episode" && currentEpisode) {
      return new PlaybackProgress(currentEpisode.duration, progressDB[currentEpisode.id] || Seconds.from(0));
    }
    return null;
  }, [currentMedia?.type, currentEpisode, progressDB]);

  // Derived progress values
  const duration: Timestamp | null = useMemo(() => progress ? progress.durationTimestamp() : null, [progress]);
  const elapsed: Timestamp | null = useMemo(() => progress ? progress.elapsedTimestamp() : null, [progress]);
  const percent: number | null = useMemo(() => progress ? progress.elapsedPercentage : null, [progress]);

  // Drag to seek handling
  const [draggedProgress, setDraggedProgress] = useState<number | null>(null);
  const debouncedDraggedProgress = useDebounce(draggedProgress, 200)[0];
  // Canon progress update after debounce
  useEffect(() => {
    if (
      debouncedDraggedProgress !== null
      && progress
      && currentMedia?.type === "episode"
      && currentEpisode
    ) {
      const newElapsed = Seconds.from(Math.round((debouncedDraggedProgress / 100) * progress.duration.toNumber()));
      setCurrentProgress(newElapsed);
    }
  }, [debouncedDraggedProgress, progress, currentMedia, currentEpisode, setCurrentProgress]);
  // Event handler
  const onProgressDrag = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (currentMedia?.type === "channel") return; // No seeking for live channels

    const inputValue = parseFloat(event.target.value);
    setDraggedProgress(inputValue);
  };

  const audioRef = useRef<HTMLAudioElement | null>(null);
  // Audio element setup
  useEffect(() => {
    if (!audioRef.current) audioRef.current = new Audio();
    const audioEl = audioRef.current;

    if (currentStreamUrl) {
      audioEl.src = currentStreamUrl;
      audioEl.autoplay = true;
      audioEl.preload = "auto";
    } else {
      audioEl.pause();
      audioEl.removeAttribute("src");
      audioEl.load();
    }
  }, [currentMedia?.type, currentStreamUrl]);
  // Time update handling
  useEffect(() => {
    const audioEl = audioRef.current;
    if (!audioEl) return;

    const onTimeUpdate = () => {
      if (currentMedia?.type === "episode" && currentEpisode) {
        const newElapsed = Seconds.from(audioEl.currentTime);
        setCurrentProgress(newElapsed);
      }
    };

    audioEl.addEventListener("timeupdate", onTimeUpdate);
    return () => {
      audioEl.removeEventListener("timeupdate", onTimeUpdate);
    };
  }, [currentEpisode, currentMedia?.type, currentStreamUrl, progress, setCurrentProgress]);
  // Play/pause handling
  useEffect(() => {
    const audioEl = audioRef.current;
    if (!audioEl) return;

    if (isPlaying) {
      audioEl.play().catch((e) => {
        console.error("Error playing audio:", e);
      });
    } else {
      audioEl.pause();
    }
  }, [isPlaying, currentStreamUrl]);


  // Audio fetching
  useEffect(() => {
    if (!currentMedia) return;

    let isCancelled = false;

    const fetchAudio = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // await new Promise((resolve) => setTimeout(resolve, 500));

        if (isCancelled) return;

        setIsLoading(false);
        setRetryCount(0); // Reset retry count on success
      }
      catch (e) {
        console.error(e);

        if (isCancelled) return;

        if (retryCount < maxRetries) {
          setRetryCount(retryCount + 1);
        } else {
          setError("Kunde inte ladda ljudströmmen.");
          setIsLoading(false);
        }
      }
    };

    fetchAudio();

    return () => {
      isCancelled = true;
    };
  }, [currentMedia, retryCount]);

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
      <audio ref={audioRef}></audio>

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
            ? "--:-- / --:--"
            : currentMedia?.type === "channel"
              ? "Live"
              : `${elapsed.toString()} / ${duration.toString()}`
          }
        </p>

        <PlayButton iconSize={30} />
      </div>
    </div>
  );
}