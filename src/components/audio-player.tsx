"use client";

import { ProgressBar } from "@/components/progress-bar";
import { PlayButton } from "@/components/play-button";
import { usePlayStateStore } from "@/store/play-state-store";
import { useProgressStore } from "@/store/progress-store";
import { useContentStore } from "@/store/content-store";
import { useCallback, useEffect, useRef } from "react";
import { getNextEpisode, getPreviousEpisode } from "@/lib/episode-finder";

/**
 * A component that displays audio controls and a progress bar 
 */
export default function AudioControls({ className }: { className?: string }) {
  // Stores
  const playStateStore = usePlayStateStore();
  const contentStore = useContentStore();
  const progressStore = useProgressStore();

  // Define audio things
  const audioURL = playStateStore.currentEpisode?.url;
  const audioRef = useRef<HTMLAudioElement>(null);
  const previousEpisodeIdRef = useRef<number | null>(null);
  const preloadRef = useRef<HTMLAudioElement | null>(null);

  // Handle errors
  useEffect(() => {
    if (!audioRef.current) return;

    const handleError = (e: Event) => {
      console.error("Audio playback error:", e);
    };

    audioRef.current.addEventListener("error", handleError);
    const currentRef = audioRef.current;

    return () => {
      if (currentRef) {
        currentRef.removeEventListener("error", handleError);
      }
    };
  }, []);

  // Sync audio ref's state with global state
  useEffect(() => {
    if (!audioRef.current) return;

    const playAudio = async () => {
      if (playStateStore.currentEpisode && playStateStore.playState === "playing") {
        try {
          await audioRef.current?.play();
        } catch (error) {
          console.error("Failed to play audio:", error);
          playStateStore.setPlayState("paused");
        }
      } else {
        audioRef.current?.pause();
      }
    };

    playAudio();
  }, [playStateStore]);

  // Load progress on episode change
  useEffect(() => {
    if (
      !audioRef.current ||
      !playStateStore.currentEpisode ||
      playStateStore.currentEpisode.id === previousEpisodeIdRef.current
    ) return;

    // Update episode reference
    previousEpisodeIdRef.current = playStateStore.currentEpisode.id;

    // Load progress if available
    const storedProgress = progressStore.episodeProgressMap[playStateStore.currentEpisode.id.toString()]?.seconds;
    if (storedProgress) audioRef.current.currentTime = storedProgress;

    // Preload the next episode
    const nextEpisode = getNextEpisode(contentStore, progressStore, playStateStore);
    if (nextEpisode) playStateStore.setPreloadEpisode(nextEpisode);

  }, [playStateStore, progressStore, contentStore]);

  // Handle progress updates
  useEffect(() => {
    if (!audioRef.current || !playStateStore.currentEpisode) return;

    const handleTimeUpdate = () => {
      if (!audioRef.current || !playStateStore.currentEpisode) return;
      if (!playStateStore.currentEpisode.meta.saveProgress) return;

      progressStore.setEpisodeProgress(
        playStateStore.currentEpisode.id.toString(),
        { seconds: audioRef.current.currentTime, finished: false }
      );
    };

    audioRef.current.addEventListener("timeupdate", handleTimeUpdate);
    const currentRef = audioRef.current;

    return () => {
      if (currentRef) {
        currentRef.removeEventListener("timeupdate", handleTimeUpdate);
      }
    };
  }, [playStateStore.currentEpisode, progressStore]);

  // Handle episode end
  useEffect(() => {
    if (!audioRef.current || !playStateStore.currentEpisode) return;

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
        console.info("No next episode found");
      }
    };

    audioRef.current.addEventListener("ended", handleEnded);
    const currentRef = audioRef.current;

    return () => {
      if (currentRef) {
        currentRef.removeEventListener("ended", handleEnded);
      }
    };
  }, [playStateStore, progressStore, contentStore]);

  // Preload the next episode
  useEffect(() => {
    // Clean up previous preload
    if (preloadRef.current) {
      preloadRef.current.src = "";
      preloadRef.current.load();
    }

    // Create new preload if needed
    if (playStateStore.preloadEpisode) {
      preloadRef.current = new Audio(playStateStore.preloadEpisode.url);
      preloadRef.current.preload = "auto";
    } else {
      preloadRef.current = null;
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
      navigator.mediaSession.setActionHandler("play", null);
      navigator.mediaSession.setActionHandler("pause", null);
      navigator.mediaSession.setActionHandler("seekbackward", null);
      navigator.mediaSession.setActionHandler("seekforward", null);
      navigator.mediaSession.setActionHandler("previoustrack", null);
      navigator.mediaSession.setActionHandler("nexttrack", null);
    };
  }, [playStateStore, contentStore, progressStore]);

  const episodeInfo = playStateStore.currentEpisode && {
    programName: playStateStore.currentEpisode.program.name,
    episodeTitle: playStateStore.currentEpisode.title,
    progressSeconds: progressStore.episodeProgressMap[playStateStore.currentEpisode.id]?.seconds || 0,
    durationSeconds: playStateStore.currentEpisode.duration,
    percent: () => {
      if (!playStateStore.currentEpisode || !episodeInfo) return 0;
      if (episodeInfo.durationSeconds === 0) return 0;
      return episodeInfo.progressSeconds / episodeInfo.durationSeconds * 100;
    },
    getHHMMSS: (seconds: number) => {
      const hour = Math.floor(seconds / 3600);
      const minute = Math.floor(seconds / 60) % 60;
      const second = Math.floor(seconds % 60);
      return [hour, minute, second];
    },
    progress: (() => {
      if (!episodeInfo) return "00:00";

      const [hour, minute, second] = episodeInfo.getHHMMSS(episodeInfo.progressSeconds);
      if (hour > 0) {
        return `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}:${second.toString().padStart(2, "0")}`;
      }
      return `${minute.toString().padStart(2, "0")}:${second.toString().padStart(2, "0")}`;
    }),
    duration: (() => {
      if (!episodeInfo) return "00:00";

      const [hour, minute, second] = episodeInfo.getHHMMSS(episodeInfo.durationSeconds);
      if (hour > 0) {
        return `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}:${second.toString().padStart(2, "0")}`;
      }
      return `${minute.toString().padStart(2, "0")}:${second.toString().padStart(2, "0")}`;
    }),
  };

  return (
    <div className={`w-full flex flex-col gap-y-2 ${className || ""}`}>
      <div className="w-full">
        {/* Progress bar */}
        <ProgressBar className="block top-0" progress={episodeInfo?.percent() || 0} />

        {/* Invisible thumb to progress */}
        <input className="block top-0 w-full h-0 z-10 scale-y-150 opacity-0" type="range" min="0" max="100"
          value={episodeInfo?.percent() || 0}
          onChange={onProgressDrag}
        />
      </div>

      {/* Audio element */}
      <audio ref={audioRef} src={audioURL}></audio>

      {/* Controls */}
      <div id="player" className="w-full flex flex-row justify-between items-center gap-x-3 px-3 mb-1">
        <div>
          <p className="font-light text-sm">{episodeInfo?.programName}</p>
          <p className="font-bold max-h-[3rem] overflow-hidden text-ellipsis whitespace-break-spaces">{episodeInfo?.episodeTitle || "Spelar inget"}</p>
        </div>

        <p className="text-sm text-zinc-400">
          {episodeInfo ? `${episodeInfo.progress()}\u00a0/\u00a0${episodeInfo.duration()}` : ""}
        </p>

        <PlayButton iconSize={30} role="controller" />
      </div>
    </div>
  );
}