"use client";

import ProgressBar from "@/components/progress-bar";
import PlayButton from "@/components/play-button";
import { useEffect, useMemo, useRef, useState } from "react";
import { EpisodeWithProgram, PlayableMedia, PlaybackProgress, Seconds, Timestamp } from "@/types/types";
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
  } = usePlayContext();

  const resolvedMedia: PlayableMedia | null = useMemo(() => currentMedia, [currentMedia]);

  // Playback progress class instance
  const progress: PlaybackProgress | null = useMemo(() => {
    if (resolvedMedia?.type === "episode" && currentEpisode) {
      return new PlaybackProgress(currentEpisode.duration, currentProgress ?? Seconds.from(0));
    }
    return null;
  }, [resolvedMedia?.type, currentEpisode, currentProgress]);

  // Derived progress values
  const duration: Timestamp | null = useMemo(() => progress ? progress.durationTimestamp() : null, [progress]);
  const elapsed: Timestamp | null = useMemo(() => progress ? progress.elapsedTimestamp() : null, [progress]);
  const percent: number | null = useMemo(() => progress ? progress.elapsedPercentage : null, [progress]);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // pool of preloader audio elements for next N tracks
  const PRELOAD_COUNT = 5;
  const preloadPoolRef = useRef<HTMLAudioElement[]>([]);

  // Create audio elements on mount
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = document.createElement("audio");
    }

    // Initialize preload pool
    if (preloadPoolRef.current.length === 0) {
      for (let i = 0; i < PRELOAD_COUNT; i++) {
        const a = document.createElement("audio");
        a.preload = "auto";
        preloadPoolRef.current.push(a);
      }
    }
  }, []);

  // Compute sorted episodes from episodeDB to know which to preload
  const sortedEpisodes = useMemo(() => {
    const vals = Object.values(episodeDB || {});
    return vals.sort((a: EpisodeWithProgram, b: EpisodeWithProgram) => new Date(b.publish_date).getTime() - new Date(a.publish_date).getTime());
  }, [episodeDB]);

  // Helper: preload next N episodes given currentEpisode
  useEffect(() => {
    if (!currentEpisode || !sortedEpisodes || sortedEpisodes.length === 0) return;

    const currentIndex = sortedEpisodes.findIndex((ep: EpisodeWithProgram) => ep.id === currentEpisode.id);
    if (currentIndex === -1) return;

    const audioPreloadEls = preloadPoolRef.current;
    let poolIdx = 0;
    for (let i = currentIndex + 1; i <= Math.min(sortedEpisodes.length - 1, currentIndex + PRELOAD_COUNT); i++) {
      const ep = sortedEpisodes[i];
      if (!ep) continue;
      const preloadEl = audioPreloadEls[poolIdx++];
      const url = getEpisodeAudioUrl(ep.id);
      // Only set src if different to avoid needless reloads
      if (preloadEl && preloadEl.src !== url) {
        preloadEl.src = url;
        preloadEl.preload = "auto";
        try { preloadEl.load(); } catch { /* Silent */ }
      }
    }
    // Clear remaining pool slots (if any)
    for (; poolIdx < audioPreloadEls.length; poolIdx++) {
      const el = audioPreloadEls[poolIdx];
      if (el && el.src) {
        el.removeAttribute("src");
        try { el.load(); } catch { /* Silent */ }
      }
    }
  }, [currentEpisode, sortedEpisodes]);

  // Audio element setup (main playback element)
  useEffect(() => {
    const audioEl = audioRef.current;
    if (!audioEl) return;

    if (currentStreamUrl) {
      audioEl.src = currentStreamUrl;
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
  const lastResumedEpisodeIdRef = useRef<string | null>(null);
  useEffect(() => {
    const audioEl = audioRef.current;
    if (!audioEl) return;
    if (resolvedMedia?.type !== "episode" || !currentEpisode) return;

    const episodeId = currentEpisode.id;
    if (lastResumedEpisodeIdRef.current === episodeId) return; // Already applied

    const saved = progressDB[episodeId];
    const durationRounded = currentEpisode.duration.toFixed(0);
    const progressRounded = saved ? Math.min(currentEpisode.duration, saved.toNumber()).toFixed(0) : null;
    if (saved && progressRounded === durationRounded) {
      // Explicitly playing a finished episode, start from beginning
      audioEl.currentTime = 0;
      setCurrentProgress(Seconds.from(0));
      return;
    }
    if (saved) audioEl.currentTime = saved.toNumber();

    lastResumedEpisodeIdRef.current = episodeId;

    // I don't want progressDB to be a dependency here
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolvedMedia?.type, currentEpisode]);


  // Drag to seek handling
  const [draggedProgress, setDraggedProgress] = useState<number | null>(null);
  const onProgressDrag = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (resolvedMedia?.type === "channel") return; // No seeking for live channels
    setDraggedProgress(parseFloat(event.target.value));
  };
  const onProgressDragEnd = () => {
    if (
      draggedProgress === null
      || resolvedMedia?.type !== "episode"
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
      Math.round((draggedProgress / 100) * currentEpisode.duration)
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
        resolvedMedia?.type !== "episode"
        || !currentEpisode
        || draggedProgress !== null
      ) return;

      setCurrentProgress(Seconds.from(audioEl.currentTime));
    };

    audioEl.addEventListener("timeupdate", onTimeUpdate);
    return () => {
      audioEl.removeEventListener("timeupdate", onTimeUpdate);
    };
  }, [currentEpisode, resolvedMedia?.type, draggedProgress, setCurrentProgress]);

  const [isLoading, setIsLoading] = useState(false);
  const debouncedIsLoading = useDebounce(isLoading, 300)[0];
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;

  // Play/pause handling
  useEffect(() => {
    const audioEl = audioRef.current;
    if (!audioEl) return;

    if (isPlaying) {
      audioEl.play().catch((e) => {
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
      setIsLoading(false);
      setError(null);
      setRetryCount(0);
      return;
    }
    const audioEl = audioRef.current;
    if (!audioEl) return;

    let isCancelled = false;

    const handleLoadStart = () => {
      if (isCancelled) return;
      setIsLoading(true);
      setError(null);
    };

    const handleCanPlay = () => {
      if (isCancelled) return;
      setIsLoading(false);
      setRetryCount(0);
      if (isPlaying) {
        audioEl.play().catch(() => {
          // Autoplay may be blocked by the browser. Ignore.
        });
      }
    };

    const handleError = () => {
      if (isCancelled) return;

      if (retryCount < maxRetries) {
        setRetryCount(prev => prev + 1);
        try { audioEl.load(); } catch { /* Silent */ }
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
      audioEl.removeEventListener("loadstart", handleLoadStart);
      audioEl.removeEventListener("canplay", handleCanPlay);
      audioEl.removeEventListener("error", handleError);
    };
  }, [currentStreamUrl, retryCount, maxRetries, isPlaying]);

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
          const skipTime = details.seekOffset || 10;
          audioEl.currentTime = Math.max(audioEl.currentTime - skipTime, 0);
        }
      });
      navigator.mediaSession.setActionHandler("seekforward", (details) => {
        const audioEl = audioRef.current;
        if (audioEl) {
          const skipTime = details.seekOffset || 10;
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
      if (currentMedia?.type === "episode") {
        playNextEpisode();
      }
    };

    audioEl.addEventListener("ended", onEnded);
    return () => {
      audioEl.removeEventListener("ended", onEnded);
    };
  }, [currentMedia, playNextEpisode]);

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
          <p className="font-light text-sm">{currentMedia?.subtitle}</p>
          <p className="font-bold max-h-12 overflow-hidden text-ellipsis whitespace-break-spaces">
            {currentMedia?.title || "Spelar inget"}
          </p>
          {error && (
            <p className="text-xs text-red-400 mt-1">{error}</p>
          )}
          {isLoading && debouncedIsLoading && !error && (
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