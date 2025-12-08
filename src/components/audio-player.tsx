"use client";

import ProgressBar from "@/components/progress-bar";
import PlayButton from "@/components/play-button";
import { useEffect, useMemo, useRef, useState } from "react";
import { AudioPlayerMedia, PlaybackProgress, Seconds, Timestamp } from "@/types/types";
import { usePlayContext } from "./play-context/play-context-use";

export default function AudioControls({ className }: { className?: string }) {
  const {
    isPlaying,
    play,
    pause,
    currentStreamUrl,
    currentEpisode,
    currentChannel,
    progressDB,
    currentProgress,
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
      return new PlaybackProgress(currentEpisode.duration, currentProgress ?? Seconds.from(0));
    }
    return null;
  }, [currentMedia?.type, currentEpisode, currentProgress]);

  // Derived progress values
  const duration: Timestamp | null = useMemo(() => progress ? progress.durationTimestamp() : null, [progress]);
  const elapsed: Timestamp | null = useMemo(() => progress ? progress.elapsedTimestamp() : null, [progress]);
  const percent: number | null = useMemo(() => progress ? progress.elapsedPercentage : null, [progress]);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  // Create audio element on mount
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = document.createElement("audio");
    }
  }, []);

  // Audio element setup
  useEffect(() => {
    const audioEl = audioRef.current;
    if (!audioEl) return;

    if (currentStreamUrl) {
      audioEl.src = currentStreamUrl;
      audioEl.autoplay = true;
      audioEl.preload = "auto";
    }
    else {
      audioEl.removeAttribute("src");
      audioEl.load();
    }
  }, [currentStreamUrl]);

  // Ready state handling
  const [isReady, setIsReady] = useState(false);
  useEffect(() => {
    const audioEl = audioRef.current;
    if (!audioEl) return;

    const onLoaded = () => setIsReady(true);
    const onEmptied = () => setIsReady(false);

    audioEl.addEventListener("loadedmetadata", onLoaded);
    audioEl.addEventListener("emptied", onEmptied);

    return () => {
      audioEl.removeEventListener("loadedmetadata", onLoaded);
      audioEl.removeEventListener("emptied", onEmptied);
    };
  }, []);

  // Resume playback position
  const lastResumedEpisodeIdRef = useRef<number | null>(null);
  useEffect(() => {
    const audioEl = audioRef.current;
    if (!audioEl) return;
    if (currentMedia?.type !== "episode" || !currentEpisode) return;

    const episodeId = currentEpisode.id;
    if (lastResumedEpisodeIdRef.current === episodeId) return; // Already applied

    const saved = progressDB[episodeId];
    if (saved) audioEl.currentTime = saved.toNumber();

    lastResumedEpisodeIdRef.current = episodeId;

    // I don't want progressDB to be a dependency here
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentMedia?.type, currentEpisode]);


  // Drag to seek handling
  const [draggedProgress, setDraggedProgress] = useState<number | null>(null);
  const onProgressDrag = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (currentMedia?.type === "channel") return; // No seeking for live channels
    setDraggedProgress(parseFloat(event.target.value));
  };
  const onProgressDragEnd = () => {
    if (
      draggedProgress === null
      || currentMedia?.type !== "episode"
      || !currentEpisode
      || !isReady
    ) {
      // Too early to seek
      setDraggedProgress(null);
      return;
    }

    const audioEl = audioRef.current;
    if (!audioEl) {
      setDraggedProgress(null);
      return;
    }

    const newElapsed = Seconds.from(
      Math.round((draggedProgress / 100) * currentEpisode.duration.toNumber())
    );

    audioEl.currentTime = newElapsed.toNumber();
    setCurrentProgress(newElapsed);

    setDraggedProgress(null);
    play();
  };
  const onProgressDragStart = (event: React.DragEvent<HTMLInputElement> | React.TouchEvent<HTMLInputElement> | React.MouseEvent<HTMLInputElement>) => {
    if (isPlaying) pause();
    setDraggedProgress(parseFloat(event.currentTarget.value));
  };
  // For immediate non-debounced visual feedback
  const displayedPercent = draggedProgress !== null
    ? draggedProgress
    : (percent ?? 0);

  // Time update handling
  useEffect(() => {
    const audioEl = audioRef.current;
    if (!audioEl) return;

    const onTimeUpdate = () => {
      if (
        currentMedia?.type !== "episode"
        || !currentEpisode
        || draggedProgress !== null
      ) return;

      setCurrentProgress(Seconds.from(audioEl.currentTime));
    };

    audioEl.addEventListener("timeupdate", onTimeUpdate);
    return () => {
      audioEl.removeEventListener("timeupdate", onTimeUpdate);
    };
  }, [currentEpisode, currentMedia?.type, draggedProgress, setCurrentProgress]);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;

  // Play/pause handling
  useEffect(() => {
    const audioEl = audioRef.current;
    if (!audioEl) return;

    if (isPlaying) {
      audioEl.play()
        .then(() => {
          setIsLoading(false);
          setRetryCount(0); // Reset retry count on success
        })
        .catch((e) => {
          if (e instanceof DOMException && e.name === "AbortError") return; // Ignore abort errors
          console.error("Error playing audio:", e)
          setError("Kunde inte spela upp ljudströmmen.");
        });
    }
    else {
      audioEl.pause();
    }
  }, [isPlaying]);

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
          progress={currentMedia?.type === "channel" ? 100 : displayedPercent}
          innerClassName={currentMedia?.type === "channel" ? "animate-pulse" : ""}
        />

        {/* Invisible thumb to progress */}
        <input
          className="block top-0 w-full h-0 z-10 scale-y-150 opacity-0"
          type="range" min="0" max="100"
          value={displayedPercent}
          onChange={onProgressDrag}
          onDragStart={onProgressDragStart}
          onTouchStart={onProgressDragStart}
          onMouseDown={onProgressDragStart}
          onDragEnd={onProgressDragEnd}
          onMouseUp={onProgressDragEnd}
          onTouchEnd={onProgressDragEnd}
        />
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
          {currentMedia?.type === "channel"
            ? "Live •"
            : !elapsed || !duration
              ? "--:-- / --:--"
              : `${elapsed.toString()} / ${duration.toString()}`
          }
        </p>

        <PlayButton iconSize={30} />
      </div>
    </div>
  );
}