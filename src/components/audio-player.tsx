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

  // Refresh audio connection without losing progress
  const refreshAudioConnection = useCallback(() => {
    if (!audioRef.current || !playStateStore.currentEpisode || !isPlayingRef.current) return;

    const audio = audioRef.current;
    const currentTime = audio.currentTime;

    // Only refresh if we have a valid time and we're actually having connection issues
    if (currentTime > 0) {
      console.log(`Refreshing audio connection at ${currentTime}s`);
      setIsLoading(true);

      const wasPlaying = playStateStore.playState === "playing";
      // Use direct URL instead of proxy
      const directUrl = `${playStateStore.currentEpisode.url}?_t=${Date.now()}`;

      const handleCanPlay = () => {
        if (audioRef.current) {
          // Use a small timeout to ensure the audio element is ready for seeking
          setTimeout(() => {
            if (audioRef.current) {
              console.log(`Restoring time to ${currentTime}s after refresh`);
              audioRef.current.currentTime = currentTime;
              setIsLoading(false);
              if (wasPlaying) {
                audioRef.current.play().catch(e => {
                  console.error("Failed to play after refresh:", e);
                  playStateStore.setPlayState("paused");
                });
              }
            }
          }, 50); // 50ms delay
        }
        audio.removeEventListener("canplay", handleCanPlay);
      };

      // Pause before changing src to ensure a clean state
      audio.pause();
      audio.addEventListener("canplay", handleCanPlay);
      audio.src = directUrl;
      audio.load();
    }
  }, [playStateStore]);

  // Stable audio element creation and event setup
  useEffect(() => {
    if (!audioRef.current) return;

    const audio = audioRef.current;
    let loadingTimeout: NodeJS.Timeout | null = null;

    const handleLoadStart = () => {
      setIsLoading(true);
      setError(null);
      // Clear any existing loading timeout
      if (loadingTimeout) {
        clearTimeout(loadingTimeout);
      }
    };

    const handleCanPlay = () => {
      setIsLoading(false);
      setError(null);
      setRetryCount(0);
      if (loadingTimeout) {
        clearTimeout(loadingTimeout);
        loadingTimeout = null;
      }
    };

    const handleError = (e: Event) => {
      // Only handle errors if we're not in the middle of loading a new track
      if (!isLoading) {
        console.error("Audio playback error:", e);
        setIsLoading(false);
        playStateStore.setPlayState("paused");

        if (retryCount < maxRetries && playStateStore.currentEpisode) {
          setError(`Nätverksproblem, prövar igen... (${retryCount + 1}/${maxRetries})`);
          setTimeout(() => {
            setRetryCount(prev => prev + 1);
            if (audioRef.current && playStateStore.currentEpisode) {
              // Use direct URL instead of proxy
              const directUrl = `${playStateStore.currentEpisode.url}?_t=${Date.now()}`;
              audioRef.current.src = directUrl;
              audioRef.current.load();
            }
          }, 2000);
        } else if (retryCount >= maxRetries) {
          setError("Ljudhämtning misslyckades. Försök igen senare.");
        }
      }
    };

    const handleStalled = () => {
      // Only handle stalls if we've been loading for more than 5 seconds
      if (loadingTimeout) {
        clearTimeout(loadingTimeout);
      }

      loadingTimeout = setTimeout(() => {
        console.warn("Audio stalled, attempting to recover...");
        if (audioRef.current && audioRef.current.currentTime > 0) {
          refreshAudioConnection();
        }
      }, 5000);
    };

    const handleWaiting = () => {
      // Don't immediately show loading for brief buffering
      if (loadingTimeout) {
        clearTimeout(loadingTimeout);
      }

      loadingTimeout = setTimeout(() => {
        setIsLoading(true);
      }, 1000); // Only show loading after 1 second of waiting
    };

    const handlePlaying = () => {
      setIsLoading(false);
      setError(null);
      isPlayingRef.current = true;
      if (loadingTimeout) {
        clearTimeout(loadingTimeout);
        loadingTimeout = null;
      }

      // Start preloading the next episode as soon as current one starts playing
      const nextEpisode = getNextEpisode(contentStore, progressStore, playStateStore);
      if (nextEpisode && nextEpisode.id !== playStateStore.preloadEpisode?.id) {
        playStateStore.setPreloadEpisode(nextEpisode);
      }
    };

    const handlePause = () => {
      isPlayingRef.current = false;
      // Don't change loading state on pause
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
        // If we have a preloaded episode and it matches, use it immediately
        if (preloadRef.current && playStateStore.preloadEpisode?.id === nextEpisode.id) {
          // Transfer the preloaded audio to the main player
          if (audioRef.current) {
            audioRef.current.src = preloadRef.current.src;
            audioRef.current.load();
          }
        }
        playStateStore.setCurrentEpisode(nextEpisode);
        // Maintain playing state for seamless transition
        playStateStore.setPlayState("playing");
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
      if (loadingTimeout) {
        clearTimeout(loadingTimeout);
      }
      audio.removeEventListener("loadstart", handleLoadStart);
      audio.removeEventListener("canplay", handleCanPlay);
      audio.removeEventListener("error", handleError);
      audio.removeEventListener("stalled", handleStalled);
      audio.removeEventListener("waiting", handleWaiting);
      audio.removeEventListener("playing", handlePlaying);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [retryCount, playStateStore, progressStore, contentStore, audioURL, isLoading, refreshAudioConnection]);

  // Sync audio ref's state with global state - prevent unwanted resets
  const syncAudioState = useCallback(async () => {
    if (!audioRef.current || !playStateStore.currentEpisode) return;

    try {
      if (playStateStore.playState === "playing") {
        setError(null);
        // Only try to play if we're not currently loading
        if (!isLoading) {
          // Don't reset currentTime if it's already set and we have stored progress
          const storedProgress = progressStore.episodeProgressMap[playStateStore.currentEpisode.id.toString()]?.seconds || 0;
          if (storedProgress > 0 && audioRef.current.currentTime === 0) {
            audioRef.current.currentTime = storedProgress;
          }
          await audioRef.current.play();
        }
      } else {
        audioRef.current.pause();
      }
    } catch (error: any) {
      // Only handle play errors, not loading errors
      if (error.name !== "AbortError" && error.name !== "NotAllowedError") {
        console.error("Failed to play audio:", error);
        playStateStore.setPlayState("paused");
        setError("Kunde inte starta uppspelning. Försök igen.");
      }
    }
  }, [playStateStore, isLoading, progressStore]);

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
    setIsLoading(true); // Set loading immediately

    // Update episode reference
    previousEpisodeIdRef.current = playStateStore.currentEpisode.id;

    // Get stored progress BEFORE loading - but reset if episode is finished
    const progressData = progressStore.episodeProgressMap[playStateStore.currentEpisode.id.toString()];
    const isFinished = progressData?.finished || false;
    const storedProgress = isFinished ? 0 : (progressData?.seconds || 0);

    // If episode was finished, reset it in the store
    if (isFinished) {
      progressStore.setEpisodeProgress(
        playStateStore.currentEpisode.id.toString(),
        { seconds: 0, finished: false }
      );
    }

    // Update audio source - use direct URL
    const audio = audioRef.current;
    const wasPlaying = playStateStore.playState === "playing";

    // Use direct URL instead of proxy for better connection stability
    const directUrl = `${playStateStore.currentEpisode.url}?_t=${Date.now()}`;

    // Pause first to prevent any automatic playback
    audio.pause();
    audio.src = directUrl;

    // Set up event handlers before loading
    const handleLoadedData = () => {
      // Set progress immediately when data is loaded
      if (storedProgress > 0 && audioRef.current) {
        audioRef.current.currentTime = storedProgress;
      }
      setIsLoading(false);

      // Only start playing if it was playing before AND we're not in an error state
      if (wasPlaying && !error) {
        // Small delay to ensure currentTime is set
        setTimeout(() => {
          if (!error && playStateStore.playState === "playing") {
            syncAudioState();
          }
        }, 50);
      }

      audio.removeEventListener("loadeddata", handleLoadedData);
    };

    // Add event listener before loading
    audio.addEventListener("loadeddata", handleLoadedData);

    // Now load the audio
    audio.load();

    // Start preloading the next episode immediately
    const nextEpisode = getNextEpisode(contentStore, progressStore, playStateStore);
    if (nextEpisode && nextEpisode.id !== playStateStore.preloadEpisode?.id) {
      playStateStore.setPreloadEpisode(nextEpisode);
    }

    return () => {
      audio.removeEventListener("loadeddata", handleLoadedData);
    };
  }, [playStateStore.currentEpisode, progressStore, contentStore, syncAudioState, error, playStateStore]);

  // Handle progress updates with throttling - ONLY update if actually playing
  useEffect(() => {
    if (!audioRef.current || !playStateStore.currentEpisode) return;

    const updateProgress = () => {
      if (!audioRef.current || !playStateStore.currentEpisode) return;
      if (!playStateStore.currentEpisode.meta.saveProgress) return;
      if (!isPlayingRef.current) return;
      if (playStateStore.playState !== "playing") return; // Double check play state

      const currentTime = audioRef.current.currentTime;
      const existingProgress = progressStore.episodeProgressMap[playStateStore.currentEpisode.id.toString()]?.seconds || 0;

      // Only update if there's a meaningful change (avoid micro-updates)
      if (Math.abs(currentTime - existingProgress) > 0.5) {
        progressStore.setEpisodeProgress(
          playStateStore.currentEpisode.id.toString(),
          { seconds: currentTime, finished: false }
        );
      }
    };

    // Update progress every 2 seconds to reduce store updates
    progressUpdateIntervalRef.current = setInterval(updateProgress, 2000);

    return () => {
      if (progressUpdateIntervalRef.current) {
        clearInterval(progressUpdateIntervalRef.current);
        progressUpdateIntervalRef.current = null;
      }
    };
  }, [playStateStore.currentEpisode, progressStore, playStateStore.playState]);

  // Preload the next episode with better cleanup and more aggressive preloading
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
        preloadRef.current.preload = "auto"; // Changed from "metadata" to "auto" for faster loading
        // Use direct URL for preloading too
        preloadRef.current.src = playStateStore.preloadEpisode.url;

        // Add error handling for preload
        const handlePreloadError = (e: Event) => {
          console.warn("Failed to preload next episode:", e);
        };

        const handlePreloadCanPlay = () => {
          console.log("Next episode preloaded successfully:", playStateStore.preloadEpisode?.title);
        };

        preloadRef.current.addEventListener("error", handlePreloadError);
        preloadRef.current.addEventListener("canplay", handlePreloadCanPlay);

        // Start loading immediately
        preloadRef.current.load();
      } catch (error) {
        console.warn("Failed to create preload audio element:", error);
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

  // Aggressively preload next episode when current episode or play state changes
  useEffect(() => {
    if (playStateStore.currentEpisode) {
      const nextEpisode = getNextEpisode(contentStore, progressStore, playStateStore);
      if (nextEpisode && nextEpisode.id !== playStateStore.preloadEpisode?.id) {
        // Small delay to not interfere with current episode loading
        const preloadTimeout = setTimeout(() => {
          playStateStore.setPreloadEpisode(nextEpisode);
        }, 1000);

        return () => clearTimeout(preloadTimeout);
      }
    }
  }, [playStateStore.currentEpisode?.id, playStateStore.playState, contentStore, progressStore, playStateStore]);

  // Monitor progress and preload more aggressively when nearing end
  useEffect(() => {
    if (!audioRef.current || !playStateStore.currentEpisode) return;

    const checkForPreload = () => {
      if (!audioRef.current || !playStateStore.currentEpisode) return;

      const currentTime = audioRef.current.currentTime;
      const duration = playStateStore.currentEpisode.duration;

      // If we're in the last 30 seconds, ensure next episode is preloaded
      if (duration && currentTime > duration - 30) {
        const nextEpisode = getNextEpisode(contentStore, progressStore, playStateStore);
        if (nextEpisode && nextEpisode.id !== playStateStore.preloadEpisode?.id) {
          console.log("Approaching end, preloading next episode:", nextEpisode.title);
          playStateStore.setPreloadEpisode(nextEpisode);
        }
      }
    };

    // Check every 5 seconds during playback
    const preloadCheckInterval = setInterval(checkForPreload, 5000);

    return () => {
      clearInterval(preloadCheckInterval);
    };
  }, [playStateStore.currentEpisode, contentStore, progressStore, playStateStore]);

  const onProgressDrag = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (!playStateStore.currentEpisode ||
      playStateStore.currentEpisode.meta.disableDragProgress) return;

    const newProgress = parseInt(e.target.value) / 100 * playStateStore.currentEpisode.duration;

    // Modify the audio element first
    if (audioRef.current) {
      audioRef.current.currentTime = newProgress;
    }

    // Then save in global store
    progressStore.setEpisodeProgress(
      playStateStore.currentEpisode.id.toString(),
      { seconds: newProgress, finished: false }
    );
  }, [playStateStore.currentEpisode, progressStore]);

  // MediaSession API setup
  useEffect(() => {
    if (
      typeof window === "undefined" ||
      !("mediaSession" in navigator) ||
      !playStateStore.currentEpisode
    ) {
      return;
    }

    const episode = playStateStore.currentEpisode;
    const programName = episode.program.name;
    const artwork = [
      { src: episode.image.square, sizes: "96x96", type: "image/png" },
      { src: episode.image.square, sizes: "128x128", type: "image/png" },
      { src: episode.image.square, sizes: "192x192", type: "image/png" },
      { src: episode.image.square, sizes: "256x256", type: "image/png" },
      { src: episode.image.square, sizes: "384x384", type: "image/png" },
      { src: episode.image.square, sizes: "512x512", type: "image/png" },
    ];

    // Only set metadata if the episode changes
    navigator.mediaSession.metadata = new window.MediaMetadata({
      title: episode.title,
      artist: programName,
      album: "Podcast",
      artwork,
    });

    // Handler functions
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

    // Cleanup function
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
    // Dependency ONLY on actual episode metadata!
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playStateStore.currentEpisode?.id, playStateStore.currentEpisode?.title, playStateStore.currentEpisode?.program.name, playStateStore.currentEpisode?.image.square]);

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

  // Heartbeat to detect unexpected playback stops
  useEffect(() => {
    if (!audioRef.current || !playStateStore.currentEpisode || playStateStore.playState !== "playing") return;

    let lastCurrentTime = 0;
    let stuckCount = 0;

    const heartbeatInterval = setInterval(() => {
      if (audioRef.current && playStateStore.playState === "playing" && !audioRef.current.paused) {
        const currentTime = audioRef.current.currentTime;

        // Check if audio is stuck (not progressing)
        if (Math.abs(currentTime - lastCurrentTime) < 0.1) {
          stuckCount++;
          console.warn(`Audio appears stuck, count: ${stuckCount}`);

          // If stuck for more than 3 checks (15 seconds), attempt recovery
          if (stuckCount >= 3) {
            console.log("Audio stuck detected, attempting recovery");
            if (playStateStore.currentEpisode) {
              // Use direct URL for recovery too
              const directUrl = `${playStateStore.currentEpisode.url}?_t=${Date.now()}`;
              audioRef.current.src = directUrl;
              audioRef.current.load();

              const handleRecoveryCanPlay = () => {
                if (audioRef.current) {
                  audioRef.current.currentTime = currentTime;
                  audioRef.current.play().catch(console.error);
                  audioRef.current.removeEventListener("canplay", handleRecoveryCanPlay);
                }
              };

              audioRef.current.addEventListener("canplay", handleRecoveryCanPlay);
            }
            stuckCount = 0;
          }
        } else {
          stuckCount = 0; // Reset if audio is progressing
        }

        lastCurrentTime = currentTime;
      }
    }, 5000); // Check every 5 seconds

    return () => {
      clearInterval(heartbeatInterval);
    };
  }, [playStateStore.currentEpisode, playStateStore.playState]);

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