"use client";

import ProgressBar from "@/components/progress-bar";
import PlayButton from "@/components/play-button";
import { PlayStateStore, usePlayStateStore } from "@/store/play-state-store";
import { ProgressStore, useProgressStore } from "@/store/progress-store";
import { ContentStore, useContentStore } from "@/store/content-store";
import { useEffect, useRef, useCallback, useState } from "react";
import type { Content } from "@/types/api/content";

const getNextEpisode = (
  contentStore: ContentStore,
  progressStore: ProgressStore,
  playStateStore: PlayStateStore,
): Content | null => {
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

const getPreviousEpisode = (
  contentStore: ContentStore,
  progressStore: ProgressStore,
  playStateStore: PlayStateStore,
): Content | null => {
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

/**
 * A component that displays audio controls and a progress bar 
 */
export default function AudioControls({ className }: { className?: string }) {
  // Stores
  const playStateStore = usePlayStateStore();
  const contentStore = useContentStore();
  const progressStore = useProgressStore();

  // Local state for error handling and loading
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;

  // Define audio things
  const audioURL = playStateStore.currentEpisode?.url;
  const audioRef = useRef<HTMLAudioElement>(null);
  const previousEpisodeIdRef = useRef<number | null>(null);
  const preloadRef = useRef<HTMLAudioElement | null>(null);
  const isPlayingRef = useRef(false);
  const progressUpdateIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Stable audio element creation and event setup
  useEffect(() => {
    if (!audioRef.current) return;

    const audio = audioRef.current;

    const handleLoadStart = () => {
      setIsLoading(true);
      setError(null);
    };

    const handleCanPlay = () => {
      setIsLoading(false);
      setError(null);
      setRetryCount(0);
    };

    const handleError = (e: Event) => {
      console.error("Audio playback error:", e);
      setIsLoading(false);
      playStateStore.setPlayState("paused");

      if (retryCount < maxRetries && playStateStore.currentEpisode) {
        setError(`Nätverksproblem, prövar igen... (${retryCount + 1}/${maxRetries})`);
        setTimeout(() => {
          setRetryCount(prev => prev + 1);
          if (audioRef.current && audioURL) {
            audioRef.current.src = audioURL;
            audioRef.current.load();
          }
        }, 2000);
      } else {
        setError("Ljudhämtning misslyckades. Försök igen senare.");
      }
    };

    const handleStalled = () => {
      console.warn("Audio stalled, attempting to recover...");
      setIsLoading(true);
      // Try to recover by seeking to current time
      if (audio.currentTime > 0) {
        const currentTime = audio.currentTime;
        setTimeout(() => {
          if (audioRef.current) {
            audioRef.current.currentTime = currentTime;
          }
        }, 100);
      }
    };

    const handleWaiting = () => {
      setIsLoading(true);
    };

    const handlePlaying = () => {
      setIsLoading(false);
      isPlayingRef.current = true;
    };

    const handlePause = () => {
      isPlayingRef.current = false;
    };

    const handleEnded = () => {
      if (!playStateStore.currentEpisode) return;

      // Set progress to finished
      progressStore.setEpisodeProgress(
        playStateStore.currentEpisode.id.toString(),
        { seconds: playStateStore.currentEpisode.duration || 0, finished: true }
      );

      // Find the next episode
      const nextEpisode = getNextEpisode(contentStore, progressStore, playStateStore);
      if (nextEpisode) {
        playStateStore.setCurrentEpisode(nextEpisode);
      } else {
        // No next episode found
        playStateStore.setCurrentEpisode(null);
        playStateStore.setPlayState("paused");
        console.info("No next episode found");
      }
    };

    // Add event listeners
    audio.addEventListener("loadstart", handleLoadStart);
    audio.addEventListener("canplay", handleCanPlay);
    audio.addEventListener("error", handleError);
    audio.addEventListener("stalled", handleStalled);
    audio.addEventListener("waiting", handleWaiting);
    audio.addEventListener("playing", handlePlaying);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("ended", handleEnded);

    // Cleanup function
    return () => {
      audio.removeEventListener("loadstart", handleLoadStart);
      audio.removeEventListener("canplay", handleCanPlay);
      audio.removeEventListener("error", handleError);
      audio.removeEventListener("stalled", handleStalled);
      audio.removeEventListener("waiting", handleWaiting);
      audio.removeEventListener("playing", handlePlaying);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [retryCount, playStateStore, progressStore, contentStore, audioURL]);

  // Sync audio ref's state with global state
  const syncAudioState = useCallback(async () => {
    if (!audioRef.current) return;

    try {
      if (playStateStore.currentEpisode && playStateStore.playState === "playing") {
        setError(null);
        await audioRef.current.play();
      } else {
        audioRef.current.pause();
      }
    } catch (error) {
      console.error("Failed to play audio:", error);
      playStateStore.setPlayState("paused");
      setError("Misslyckades att starta uppspelning. Försök igen.");
    }
  }, [playStateStore]);

  useEffect(() => {
    syncAudioState();
  }, [syncAudioState]);

  // Load progress on episode change
  useEffect(() => {
    if (
      !audioRef.current ||
      !playStateStore.currentEpisode ||
      playStateStore.currentEpisode.id === previousEpisodeIdRef.current
    ) return;

    // Clear any existing error
    setError(null);
    setRetryCount(0);

    // Update episode reference
    previousEpisodeIdRef.current = playStateStore.currentEpisode.id;

    // Update audio source
    const audio = audioRef.current;
    const wasPlaying = playStateStore.playState === "playing";

    audio.src = playStateStore.currentEpisode.url;
    audio.load();

    // Load progress if available
    const storedProgress = progressStore.episodeProgressMap[playStateStore.currentEpisode.id.toString()]?.seconds;

    const handleCanPlayThrough = () => {
      if (storedProgress && audioRef.current) {
        audioRef.current.currentTime = storedProgress;
      }
      if (wasPlaying) {
        syncAudioState();
      }
      audio.removeEventListener("canplaythrough", handleCanPlayThrough);
    };

    audio.addEventListener("canplaythrough", handleCanPlayThrough);

    // Preload the next episode
    const nextEpisode = getNextEpisode(contentStore, progressStore, playStateStore);
    if (nextEpisode) playStateStore.setPreloadEpisode(nextEpisode);

    return () => {
      audio.removeEventListener("canplaythrough", handleCanPlayThrough);
    };
  }, [playStateStore.currentEpisode, progressStore, contentStore, syncAudioState]);

  // Handle progress updates with throttling
  useEffect(() => {
    if (!audioRef.current || !playStateStore.currentEpisode) return;

    const updateProgress = () => {
      if (!audioRef.current || !playStateStore.currentEpisode) return;
      if (!playStateStore.currentEpisode.meta.saveProgress) return;
      if (!isPlayingRef.current) return;

      progressStore.setEpisodeProgress(
        playStateStore.currentEpisode.id.toString(),
        { seconds: audioRef.current.currentTime, finished: false }
      );
    };

    // Update progress every second instead of on every timeupdate
    progressUpdateIntervalRef.current = setInterval(updateProgress, 1000);

    return () => {
      if (progressUpdateIntervalRef.current) {
        clearInterval(progressUpdateIntervalRef.current);
        progressUpdateIntervalRef.current = null;
      }
    };
  }, [playStateStore.currentEpisode, progressStore]);

  // Preload the next episode with better cleanup
  useEffect(() => {
    // Clean up previous preload
    if (preloadRef.current) {
      preloadRef.current.src = "";
      preloadRef.current.load();
      preloadRef.current = null;
    }

    // Create new preload if needed
    if (playStateStore.preloadEpisode) {
      try {
        preloadRef.current = new Audio();
        preloadRef.current.preload = "metadata";
        preloadRef.current.src = playStateStore.preloadEpisode.url;
      } catch (error) {
        console.warn("Failed to preload next episode:", error);
      }
    }

    // Cleanup function
    return () => {
      if (preloadRef.current) {
        preloadRef.current.src = "";
        preloadRef.current.load();
        preloadRef.current = null;
      }
    };
  }, [playStateStore.preloadEpisode]);

  const onProgressDrag = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (!playStateStore.currentEpisode ||
      playStateStore.currentEpisode.meta.disableDragProgress) return;

    const newProgress = parseInt(e.target.value) / 100 * playStateStore.currentEpisode.duration;

    // Modify the audio element
    if (audioRef.current) {
      audioRef.current.currentTime = newProgress;
    }

    // Save in global store
    progressStore.setEpisodeProgress(
      playStateStore.currentEpisode.id.toString(),
      { seconds: newProgress, finished: false }
    );
  }, [playStateStore.currentEpisode, progressStore]);

  // MediaSession API setup
  useEffect(() => {
    if (!("mediaSession" in navigator) || !playStateStore.currentEpisode) return;

    // Setup MediaSession metadata
    navigator.mediaSession.metadata = new MediaMetadata({
      title: playStateStore.currentEpisode.title,
      artist: playStateStore.currentEpisode.program.name,
      album: "Podcast",
      artwork: [
        { src: playStateStore.currentEpisode.image.square, sizes: "96x96", type: "image/png" },
        { src: playStateStore.currentEpisode.image.square, sizes: "128x128", type: "image/png" },
        { src: playStateStore.currentEpisode.image.square, sizes: "192x192", type: "image/png" },
        { src: playStateStore.currentEpisode.image.square, sizes: "256x256", type: "image/png" },
        { src: playStateStore.currentEpisode.image.square, sizes: "384x384", type: "image/png" },
        { src: playStateStore.currentEpisode.image.square, sizes: "512x512", type: "image/png" },
      ]
    });

    // Define action handlers
    const playHandler = () => playStateStore.setPlayState("playing");
    const pauseHandler = () => playStateStore.setPlayState("paused");
    const seekBackwardHandler = (details: any) => {
      if (audioRef.current) {
        audioRef.current.currentTime = Math.max(
          audioRef.current.currentTime - (details.seekOffset || 10), 0
        );
      }
    };
    const seekForwardHandler = (details: any) => {
      if (audioRef.current) {
        audioRef.current.currentTime = Math.min(
          audioRef.current.currentTime + (details.seekOffset || 10),
          audioRef.current.duration
        );
      }
    };
    const prevTrackHandler = () => {
      const previousEpisode = getPreviousEpisode(contentStore, progressStore, playStateStore);
      if (previousEpisode) {
        playStateStore.setCurrentEpisode(previousEpisode);
      }
    };
    const nextTrackHandler = () => {
      const nextEpisode = getNextEpisode(contentStore, progressStore, playStateStore);
      if (nextEpisode) {
        playStateStore.setCurrentEpisode(nextEpisode);
      }
    };

    // Set action handlers
    navigator.mediaSession.setActionHandler("play", playHandler);
    navigator.mediaSession.setActionHandler("pause", pauseHandler);
    navigator.mediaSession.setActionHandler("seekbackward", seekBackwardHandler);
    navigator.mediaSession.setActionHandler("seekforward", seekForwardHandler);
    navigator.mediaSession.setActionHandler("previoustrack", prevTrackHandler);
    navigator.mediaSession.setActionHandler("nexttrack", nextTrackHandler);

    // Cleanup function to remove handlers when component unmounts or episode changes
    return () => {
      if ("mediaSession" in navigator) {
        navigator.mediaSession.setActionHandler("play", null);
        navigator.mediaSession.setActionHandler("pause", null);
        navigator.mediaSession.setActionHandler("seekbackward", null);
        navigator.mediaSession.setActionHandler("seekforward", null);
        navigator.mediaSession.setActionHandler("previoustrack", null);
        navigator.mediaSession.setActionHandler("nexttrack", null);
      }
    };
  }, [playStateStore, contentStore, progressStore]);

  const currentEpisode = playStateStore.currentEpisode;
  const episodeInfo: {
    programName: string;
    episodeTitle: string;
    progressSeconds: number;
    durationSeconds: number;
    percent: () => number;
    getHHMMSS: (seconds: number) => [number, number, number];
    progress: string;
    duration: string;
  } | null = currentEpisode
      ? {
        programName: currentEpisode.program.name,
        episodeTitle: currentEpisode.title,
        progressSeconds:
          progressStore.episodeProgressMap[currentEpisode.id]?.seconds || 0,
        durationSeconds: currentEpisode.duration,
        percent: () => {
          const progressSeconds =
            progressStore.episodeProgressMap[currentEpisode.id]?.seconds || 0;
          const durationSeconds = currentEpisode.duration;
          return durationSeconds === 0 ? 0 : (progressSeconds / durationSeconds) * 100;
        },
        getHHMMSS: (seconds: number) => {
          const hour = Math.floor(seconds / 3600);
          const minute = Math.floor(seconds / 60) % 60;
          const second = Math.floor(seconds % 60);
          return [hour, minute, second];
        },
        progress: "",
        duration: ""
      }
      : null;

  if (episodeInfo) {
    const { getHHMMSS, progressSeconds, durationSeconds } = episodeInfo;
    const [pHour, pMinute, pSecond] = getHHMMSS(progressSeconds);
    episodeInfo.progress =
      pHour > 0
        ? `${pHour.toString().padStart(2, "0")}:${pMinute.toString().padStart(2, "0")}:${pSecond.toString().padStart(2, "0")}`
        : `${pMinute.toString().padStart(2, "0")}:${pSecond.toString().padStart(2, "0")}`;
    const [dHour, dMinute, dSecond] = getHHMMSS(durationSeconds);
    episodeInfo.duration =
      dHour > 0
        ? `${dHour.toString().padStart(2, "0")}:${dMinute.toString().padStart(2, "0")}:${dSecond.toString().padStart(2, "0")}`
        : `${dMinute.toString().padStart(2, "0")}:${dSecond.toString().padStart(2, "0")}`;
  }

  return (
    <div className={`w-full flex flex-col gap-y-2 ${className || ""}`}>
      <div className="w-full">
        {/* Progress bar */}
        <ProgressBar className="block top-0" progress={episodeInfo?.percent() || 0} />

        {/* Invisible thumb to progress */}
        <input className="block top-0 w-full h-0 z-10 scale-y-150 opacity-0" type="range" min="0" max="100"
          value={episodeInfo?.percent() || 0}
          onChange={onProgressDrag} />
      </div>

      {/* Audio element */}
      <audio ref={audioRef} preload="metadata"></audio>

      {/* Controls */}
      <div id="player" className="w-full flex flex-row justify-between items-center gap-x-3 px-3 mb-1">
        <div className="flex-1 min-w-0">
          <p className="font-light text-sm">{episodeInfo?.programName}</p>
          <p className="font-bold max-h-[3rem] overflow-hidden text-ellipsis whitespace-break-spaces">
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

        <PlayButton iconSize={30} role="controller" />
      </div>
    </div>
  );
}