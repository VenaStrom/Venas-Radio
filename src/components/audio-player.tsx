"use client";

import ProgressBar from "@/components/progress-bar";
import PlayButton from "@/components/play-button";
import { PlayStateStore, usePlayStateStore } from "@/store/play-state-store";
import { ProgressStore, useProgressStore } from "@/store/progress-store";
import { ContentStore, useContentStore } from "@/store/content-store";
import { useEffect, useCallback, useState, useMemo, useRef } from "react";
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

export default function AudioControls({ className }: { className?: string }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;

  const episodeInfo = useMemo(() => {
    const playStateStore = usePlayStateStore.getState();
    const progressStore = useProgressStore.getState();
    const episode = playStateStore.currentEpisode;
    if (!episode) return null;

    const progressData = progressStore.episodeProgressMap[episode.id];
    const durationSeconds = episode.duration || 0;
    const progressSeconds = progressData.seconds || 0;
    const percent = durationSeconds > 0 ? (progressSeconds / durationSeconds) * 100 : 0;

    const formatTime = (seconds: number) => {
      const mins = Math.floor(seconds / 60);
      const secs = Math.floor(seconds % 60);
      return `${mins}:${secs.toString().padStart(2, "0")}`;
    };

    return {
      programName: episode.program.name,
      episodeTitle: episode.title,
      duration: formatTime(durationSeconds),
      progress: formatTime(progressSeconds),
      percent,
    };
  }, []);

  const audioRef = useRef<HTMLAudioElement>(null);
  const audioURL = usePlayStateStore((state) => state.currentEpisode?.url || null);

  // Handle audio state
  useEffect(() => {
    const audioElement = audioRef.current;
    if (!audioElement) return;

    if (audioURL) {
      setIsLoading(true);
      setError(null);
      audioElement.src = audioURL;
      audioElement.load();

      const onLoadedData = () => {
        setIsLoading(false);
        setRetryCount(0);
      };

      const onError = () => {
        if (retryCount < maxRetries) {
          setRetryCount((prev) => prev + 1);
          audioElement.load();
        } else {
          setIsLoading(false);
          setError("Kunde inte ladda ljudet.");
        }
      };

      audioElement.addEventListener("loadeddata", onLoadedData);
      audioElement.addEventListener("error", onError);

      return () => {
        audioElement.removeEventListener("loadeddata", onLoadedData);
        audioElement.removeEventListener("error", onError);
      };
    } else {
      audioElement.src = "";
    }
  }, [audioURL, retryCount]);

  // const onProgressDrag = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
  //   const audioElement = audioRef.current;
  //   if (!audioElement || !episodeInfo) return;

  //   const newPercent = parseFloat(event.target.value);
  //   const newTime = (newPercent / 100) * (audioElement.duration || 0);
  //   audioElement.currentTime = newTime;

  //   // Update progress in the store
  //   const playStateStore = usePlayStateStore.getState();
  //   const progressStore = useProgressStore.getState();
  //   if (playStateStore.currentEpisode) {
  //     progressStore.setEpisodeProgress(playStateStore.currentEpisode.id.toString(), {
  //       seconds: newTime,
  //       finished: false,
  //     });
  //   }
  // }, [episodeInfo]);
  const onProgressDrag = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const playStateStore = usePlayStateStore.getState();

    if (!playStateStore.currentEpisode ||
      playStateStore.currentEpisode.meta.disableDragProgress) return;

    const newProgress = parseInt(e.target.value) / 100 * playStateStore.currentEpisode.duration;

    // Modify the audio element first
    if (audioRef.current) {
      audioRef.current.currentTime = newProgress;
    }

    // Then save in global store
    useProgressStore.setState((state) => {
      state.episodeProgressMap[playStateStore.currentEpisode!.id] = {
        seconds: newProgress,
        finished: false,
      };
      return state;
    });
  }, []);


  return (
    <div className={`w-full flex flex-col gap-y-2 ${className || ""}`}>
      <div className="w-full">
        {/* Progress bar */}
        <ProgressBar className="block top-0" progress={episodeInfo?.percent || 0} />

        {/* Invisible thumb to progress */}
        <input className="block top-0 w-full h-0 z-10 scale-y-150 opacity-0" type="range" min="0" max="100"
          value={episodeInfo?.percent || 0} 
          onChange={onProgressDrag}
        />
      </div>

      {/* Audio element */}
      <audio ref={audioRef} preload="metadata"></audio>

      {/* Controls */}
      <div id="player" className="w-full flex flex-row justify-between items-center gap-x-3 px-3 mb-1">
        <div className="flex-1 min-w-0">
          <p className="font-light text-sm">{episodeInfo?.programName || ""}</p>
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