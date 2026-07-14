"use client";

import ProgressBar from "@/components/progress-bar";
import PlayButton from "@/components/play-button";
import { useEffect, useMemo, useRef, useState } from "react";
import type { EpisodeWithProgram, Timestamp } from "@/types/types";
import { PlaybackProgress, Seconds } from "@/types/types";
import { usePlayContext } from "@/components/play-context/play-context-use";
import { useDebounce } from "use-debounce";
import { getEpisodeAudioUrl } from "@/lib/episode-audio";

export default function AudioControls({ className }: { className?: string }) {
  const {
    isPlaying,
    play,
    pause,
    currentStreamUrl,
    currentEpisode,
    currentMedia,
    progressDB,
    episodeDB,
    currentProgress,
    setCurrentProgress,
    playNextEpisode,
    playPreviousEpisode,
    remoteProgressVersion,
  } = usePlayContext();

  const displayTitle = useMemo(() => {
    return currentMedia?.title
      ?? currentEpisode?.title
      ?? (currentStreamUrl ? "Laddar..." : "Spelar inget");
  }, [currentEpisode?.title, currentMedia?.title, currentStreamUrl]);

  const displaySubtitle = useMemo(() => {
    return currentMedia?.subtitle
      ?? currentEpisode?.program?.name
      ?? "";
  }, [currentEpisode?.program?.name, currentMedia?.subtitle]);

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
  const resumeAppliedRef = useRef(false);
  const completionThresholdSeconds = 2;

  // Create audio element on mount
  useEffect(() => {
    audioRef.current ??= document.createElement("audio");
  }, []);

  // Compute sorted episodes from episodeDB to know which to preload
  const sortedEpisodes = useMemo(() => {
    const vals = Object.values(episodeDB || {});
    return vals.sort((a: EpisodeWithProgram, b: EpisodeWithProgram) => new Date(b.publish_date).getTime() - new Date(a.publish_date).getTime());
  }, [episodeDB]);

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

  // Warm the server-side audio cache for the next episodes so track changes
  // start fast, without downloading any audio to the client. Waits until the
  // current track is ready so warming never competes with it for bandwidth.
  const WARM_COUNT = 5;
  const warmedEpisodesRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    if (!isReady || !currentEpisode || sortedEpisodes.length === 0) return;

    const currentIndex = sortedEpisodes.findIndex((ep: EpisodeWithProgram) => ep.id === currentEpisode.id);
    if (currentIndex === -1) return;

    for (let i = currentIndex + 1; i <= Math.min(sortedEpisodes.length - 1, currentIndex + WARM_COUNT); i++) {
      const episode = sortedEpisodes[i];
      if (!episode || warmedEpisodesRef.current.has(episode.id)) continue;
      warmedEpisodesRef.current.add(episode.id);
      void fetch(getEpisodeAudioUrl(episode.id), { method: "HEAD" }).catch(() => undefined);
    }
  }, [isReady, currentEpisode, sortedEpisodes]);

  // Resume playback position
  const lastResumedEpisodeRef = useRef<{ episodeId: string | null; version: number | null }>({
    episodeId: null,
    version: null,
  });
  useEffect(() => {
    const audioEl = audioRef.current;
    if (!audioEl) return;
    if (currentMedia?.type !== "episode" || !currentEpisode) return;

    const episodeId = currentEpisode.id;
    if (
      lastResumedEpisodeRef.current.episodeId === episodeId
      && lastResumedEpisodeRef.current.version === remoteProgressVersion
    ) return; // Already applied for this remote version

    resumeAppliedRef.current = false;

    const saved = progressDB[episodeId];
    const savedSeconds = saved ? Math.min(currentEpisode.duration, saved.toNumber()) : null;
    const isComplete = savedSeconds !== null
      && savedSeconds >= Math.max(0, currentEpisode.duration - completionThresholdSeconds);

    if (saved && isComplete) {
      // Explicitly playing a finished episode, start from beginning
      audioEl.currentTime = 0;
      setCurrentProgress(Seconds.from(0));
      resumeAppliedRef.current = true;
    }
    else if (saved) {
      if (savedSeconds !== null && Math.abs(audioEl.currentTime - savedSeconds) > 1) {
        audioEl.currentTime = savedSeconds;
      }
      resumeAppliedRef.current = true;
    }
    else {
      resumeAppliedRef.current = true;
    }

    lastResumedEpisodeRef.current = { episodeId, version: remoteProgressVersion };

    // Avoid re-running on every progressDB update; rely on remoteProgressVersion.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentMedia?.type, currentEpisode, remoteProgressVersion]);


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
      Math.round((draggedProgress / 100) * currentEpisode.duration),
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
  const displayedPercent = draggedProgress ?? (percent ?? 0);

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

      if (!resumeAppliedRef.current) return;

      setCurrentProgress(Seconds.from(audioEl.currentTime));
    };

    audioEl.addEventListener("timeupdate", onTimeUpdate);
    return () => {
      audioEl.removeEventListener("timeupdate", onTimeUpdate);
    };
  }, [currentEpisode, currentMedia?.type, draggedProgress, setCurrentProgress]);

  const [isLoading, setIsLoading] = useState(false);
  const debouncedIsLoading = useDebounce(isLoading, 300)[0];
  const [error, setError] = useState<string | null>(null);
  const isPlayingRef = useRef(isPlaying);
  const retryTimeoutRef = useRef<number | null>(null);
  const loadAttemptRef = useRef(0);
  const currentLoadTokenRef = useRef(0);
  const maxLoadRetries = 3;
  const retryDelayMs = 600;

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  // Play/pause handling
  useEffect(() => {
    const audioEl = audioRef.current;
    if (!audioEl) return;

    if (isPlaying) {
      audioEl.play().catch((e: unknown) => {
        if (e instanceof DOMException && e.name === "AbortError") return; // Ignore abort errors
        console.error("Error playing audio:", e);
        setError("Kunde inte spela upp ljudströmmen.");
      });
    }
    else {
      audioEl.pause();
    }
  }, [isPlaying]);

  // Audio fetching
  useEffect(() => {
    // When nothing is selected or no stream URL, clear state and exit
    if (!currentStreamUrl) {
      const audioEl = audioRef.current;
      if (audioEl) {
        audioEl.removeAttribute("src");
        try {
          audioEl.load();
        }
        catch {
          // Silent
        }
      }
      setIsLoading(false);
      setError(null);
      loadAttemptRef.current = 0;
      if (retryTimeoutRef.current !== null) {
        window.clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
      return;
    }
    const audioEl = audioRef.current;
    if (!audioEl) return;

    let isCancelled = false;
    currentLoadTokenRef.current += 1;
    const loadToken = currentLoadTokenRef.current;
    loadAttemptRef.current = 0;

    if (retryTimeoutRef.current !== null) {
      window.clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }

    audioEl.src = currentStreamUrl;
    audioEl.preload = "auto";
    try {
      audioEl.load();
    }
    catch {
      // Silent
    }

    const handleLoadStart = () => {
      if (isCancelled) return;
      setIsLoading(true);
      setError(null);
    };

    const handleCanPlay = () => {
      if (isCancelled) return;
      setIsLoading(false);
      loadAttemptRef.current = 0;
      if (retryTimeoutRef.current !== null) {
        window.clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
      if (isPlayingRef.current) {
        audioEl.play().catch(() => {
          // Autoplay may be blocked by the browser. Ignore.
        });
      }
    };

    const handleError = () => {
      if (isCancelled) return;

      if (loadAttemptRef.current < maxLoadRetries) {
        loadAttemptRef.current += 1;
        const retryUrl = `${currentStreamUrl}${currentStreamUrl.includes("?") ? "&" : "?"}retry=${loadToken}-${loadAttemptRef.current}-${Date.now()}`;

        if (retryTimeoutRef.current !== null) {
          window.clearTimeout(retryTimeoutRef.current);
        }

        retryTimeoutRef.current = window.setTimeout(() => {
          if (isCancelled) return;
          if (loadToken !== currentLoadTokenRef.current) return;

          audioEl.src = retryUrl;
          audioEl.preload = "auto";
          try {
            audioEl.load();
          }
          catch {
            // Silent
          }
        }, retryDelayMs * loadAttemptRef.current);
      }
      else {
        setIsLoading(false);
        setError("Kunde inte ladda ljudströmmen.");
      }
    };

    audioEl.addEventListener("loadstart", handleLoadStart);
    audioEl.addEventListener("canplay", handleCanPlay);
    audioEl.addEventListener("error", handleError);

    return () => {
      isCancelled = true;
      if (retryTimeoutRef.current !== null) {
        window.clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
      audioEl.removeEventListener("loadstart", handleLoadStart);
      audioEl.removeEventListener("canplay", handleCanPlay);
      audioEl.removeEventListener("error", handleError);
    };
  }, [currentStreamUrl]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code === "Space") {
        event.preventDefault();
        if (isPlaying) {
          pause();
        } else {
          play();
        }
      }

      if (event.code === "ArrowRight") {
        event.preventDefault();
        const audioEl = audioRef.current;
        if (audioEl) {
          audioEl.currentTime = Math.min(audioEl.currentTime + 15, audioEl.duration);
        }
      }

      if (event.code === "ArrowLeft") {
        event.preventDefault();
        const audioEl = audioRef.current;
        if (audioEl) {
          audioEl.currentTime = Math.max(audioEl.currentTime - 15, 0);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isPlaying, play, pause]);

  // Media session
  useEffect(() => {
    if (!("mediaSession" in navigator)) return;

    if (!currentMedia) return;

    // Metadata
    navigator.mediaSession.metadata = new MediaMetadata({
      title: currentMedia.title,
      artist: currentMedia.subtitle ?? undefined,
      album: currentMedia.type === "episode" ? "Podcastavsnitt" : "Radiokanal",
      artwork: currentMedia.image ? [
        { src: currentMedia.image, sizes: "512x512", type: "image/png" },
      ] : [],
    });

    // Action handlers
    navigator.mediaSession.setActionHandler("play", () => play());
    navigator.mediaSession.setActionHandler("pause", () => pause());
    if (currentMedia.type === "episode") {
      navigator.mediaSession.setActionHandler("seekbackward", (details) => {
        const audioEl = audioRef.current;
        if (audioEl) {
          const skipTime = details.seekOffset ?? 10;
          audioEl.currentTime = Math.max(audioEl.currentTime - skipTime, 0);
        }
      });
      navigator.mediaSession.setActionHandler("seekforward", (details) => {
        const audioEl = audioRef.current;
        if (audioEl) {
          const skipTime = details.seekOffset ?? 10;
          audioEl.currentTime = Math.min(audioEl.currentTime + skipTime, audioEl.duration);
        }
      });
      navigator.mediaSession.setActionHandler("seekto", (details) => {
        const audioEl = audioRef.current;
        if (audioEl && details.seekTime !== undefined) {
          audioEl.currentTime = details.seekTime;
        }
      });
      navigator.mediaSession.setActionHandler("previoustrack", () => {
        playPreviousEpisode();
      });
      navigator.mediaSession.setActionHandler("nexttrack", () => {
        playNextEpisode();
      });
    }

  }, [currentMedia, pause, play, playNextEpisode, playPreviousEpisode]);

  // Play next episode when currentEpisode ends
  useEffect(() => {
    const audioEl = audioRef.current;
    if (!audioEl) return;

    const onEnded = () => {
      if (currentMedia?.type !== "episode" || !currentEpisode) return;
      setCurrentProgress(Seconds.from(currentEpisode.duration));
      playNextEpisode();
    };

    audioEl.addEventListener("ended", onEnded);
    return () => {
      audioEl.removeEventListener("ended", onEnded);
    };
  }, [currentEpisode, currentMedia?.type, playNextEpisode, setCurrentProgress]);

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
          className="block top-0 w-full h-0 z-10 scale-y-150 opacity-0 cursor-pointer"
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
          <p className="font-light text-sm" suppressHydrationWarning={true}>
            {displaySubtitle}
          </p>
          <p className="font-bold max-h-10 overflow-hidden wrap-break-word leading-tight" suppressHydrationWarning={true}>
            {displayTitle}
          </p>
          {error ? <p className="text-xs text-red-400 mt-1">{error}</p> : null}
          {isLoading && debouncedIsLoading && !error ? <p className="text-xs text-zinc-400 mt-1">Laddar...</p> : null}
        </div>

        <p className="text-sm text-zinc-400 whitespace-nowrap" suppressHydrationWarning={true}>
          {currentMedia?.type === "channel"
            ? "Live •"
            : !elapsed || !duration
              ? "--:-- / --:--"
              : `${elapsed.toString()} / ${duration.toString()}`}
        </p>

        <PlayButton iconSize={30} />
      </div>
    </div>
  );
}