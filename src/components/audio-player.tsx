"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Slider } from "@shadcn/slider";
import { PlayButton } from "./play-button";
import { useAudioContext } from "./audio-context";
import { useDebounce } from "use-debounce";
import { useSession } from "@clerk/nextjs";

/** To make it easier to drag the progress slider to edge values, add some dead space at the start and end */
const sliderMargin = 9;

export function AudioPlayer({ className = "" }: { className?: string }) {
  const { session } = useSession();
  
  const { audioPacket: packet, setAudioPacket } = useAudioContext();

  const audioRef = useRef<HTMLAudioElement>(typeof window !== "undefined" ? new Audio(packet.url || "") : null);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  // To prevent state updating while dragging the slider
  const [isSliding, setIsSliding] = useState<boolean>(false);
  const [sliderPosition, setSliderPosition] = useState<number>(-sliderMargin);

  // Track last saved progress to avoid unnecessary saves
  const lastSavedProgressRef = useRef<number>(0);

  // Debounce progress updates to limit API calls
  const debouncedProgress = useDebounce(packet.progress, 2000);

  // Progress and duration as "mm:ss"
  const prettyProgress = useMemo(() => formatTime(packet.progress), [packet.progress]);
  const prettyDuration = useMemo(() => formatTime(packet.duration), [packet.duration]);

  /* Audio ref event handlers */
  const handleTimeUpdate = useCallback(() => {
    if (!audioRef.current) return;
    const updatedProgress = audioRef.current.currentTime;
    setAudioPacket({ ...packet, progress: updatedProgress });
  }, [packet, setAudioPacket]);
  const handleWaiting = useCallback(() => {
    setIsLoading(true);
  }, []);
  const handlePlaying = useCallback(() => {
    setIsLoading(false);
  }, []);
  const handleCanPlay = useCallback(() => {
    if (!audioRef.current) return;

    audioRef.current.play()
      .then(() => setIsPlaying(true))
      .catch((error) => {
        if (error.name === "AbortError") return; // Ignore abort errors
        console.error("Audio playback error:", error);
      });
  }, []);

  const saveProgressToServer = useCallback(async (progress: number) => {
    if (!session?.user?.id || !packet.currentId) return;

    // Only save if we've progressed at least 3 seconds or it's the first save
    const progressDelta = Math.abs(progress - lastSavedProgressRef.current);
    if (progressDelta < 3 && lastSavedProgressRef.current !== 0) return;

    try {
      const response = await fetch("/api/progress", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: session.user.id,
          episodeId: packet.currentId,
          progressMS: Math.floor(progress * 1000), // Convert to milliseconds
        }),
      });

      if (response.ok) {
        lastSavedProgressRef.current = progress;
        console.debug("Progress saved:", progress);
      }
    } catch (error) {
      console.error("Failed to save progress:", error);
    }
  }, [session, packet.currentId]);

  // Save progress when debounced progress changes and we're playing
  useEffect(() => {
    if (isPlaying && debouncedProgress[0] > 0) {
      saveProgressToServer(debouncedProgress[0]);
    }
  }, [debouncedProgress, isPlaying, saveProgressToServer]);

  // Save progress when playback stops
  useEffect(() => {
    if (!isPlaying && packet.progress > 0) {
      saveProgressToServer(packet.progress);
    }
  }, [isPlaying, packet.progress, saveProgressToServer]);

  /* On progress change */
  useEffect(() => {
    if (isSliding) return; // Ignore change when sliding

    const percent = (packet.progress / packet.duration) * 100;
    setSliderPosition(calculatePosition(percent));

    if (!audioRef.current) return;

    const delta = packet.progress - audioRef.current.currentTime;
    if (Math.abs(delta) < 0.1) return; // Avoid setting the time if it's already close enough to prevent skipping and jitter

    audioRef.current.currentTime = packet.progress;
  }, [packet.progress, packet.duration, isSliding]);
  /* On url change */
  useEffect(() => {
    if (!audioRef.current) return;
    if (!packet.url) return;

    const audio = audioRef.current;

    // For the visuals
    setIsPlaying(true);
    setIsLoading(true);

    // Stop any current playback
    audio.pause();
    // Update the source
    audio.src = packet.url;
    // When ready, the previously registered listener will play the audio
    audio.load();

    return () => {
      if (audio) {
        audio.pause();
        audio.src = "";
        setIsPlaying(false);
      }
    };
  }, [packet.url]);

  /** On play button click */
  const handlePlay = useCallback(() => {
    if (!audioRef.current) return console.info("No audio ref");
    if (!packet.url) return console.info("No url");

    if (!audioRef.current.src) {
      console.info("Setting url");
      audioRef.current.src = packet.url;
    }

    // Play/Pause
    if (isPlaying) {
      /* Pause it */
      audioRef.current.pause();
      setIsPlaying(false);
    }
    else {
      /* Play it */
      audioRef.current.play()
        .then(() => setIsPlaying(true))
        .catch(err => console.error("Play error:", err));
    }
  }, [isPlaying, packet]);
  /** When slider changes. To visually show where you're sliding. */
  const handleValueChange = useCallback((value: number[]) => {
    setIsSliding(true);
    setSliderPosition(value[0]);
  }, []);
  /** When slider is released */
  const handleValueCommit = useCallback((value: number[]) => {
    setIsSliding(false);

    const actual = clampPercent(value[0]);
    const visual = calculatePosition(value[0]);
    setSliderPosition(visual);

    // Update the packet with the new progress value
    const newProgress = (actual / 100) * packet.duration;
    setAudioPacket({ ...packet, progress: newProgress });
  }, [packet, setAudioPacket]);

  return (
    <div className={`w-full flex flex-col ${className}`}>
      <audio className="hidden" ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onPlaying={handlePlaying}
        onWaiting={handleWaiting}
        onCanPlay={handleCanPlay}
      />

      {/* Progressbar & slider */}
      <div className="w-full flex flex-row">
        <Slider
          value={[sliderPosition]}
          min={-sliderMargin}
          max={100 + sliderMargin}
          className={`**:rounded-none z-20 brightness-90 h-1 ${isLoading ? "animate-pulse" : ""}`}
          onValueCommit={handleValueCommit}
          onValueChange={handleValueChange}
        />
        {/* Thumb style */}
        <style>
          {`
            *[data-slot='slider-thumb'] {
              z-index: 20;
              height: 64px;
              width: 96px;
              overflow: visible;
              opacity: 0;
            }
          `}
        </style>
      </div>

      <div className="flex flex-col ps-3.5 pe-5 pt-3 pb-4">
        {/* Super title */}
        <p className={`text-xs overflow-hidden transition-all duration-100 ease-in-out ${(packet?.superTitle || "") ? "h-4" : "h-0"}`}>
          <span className="text-xs font-light opacity-60">{packet?.superTitle}</span>
        </p>

        <div className="flex flex-row items-center justify-between gap-x-5">
          <div className="overflow-hidden flex-1">
            {/* Title */}
            <p className="text-base font-bold max-h-[3.1em]">{packet?.title}</p>
            {/* Subtitle */}
            {/* <p></p> */}
          </div>

          {/* Time */}
          <p className="text-sm opacity-80">
            {prettyProgress}&nbsp;/&nbsp;{prettyDuration}
          </p>

          <PlayButton onClick={handlePlay} isPlaying={isPlaying} className="size-7 z-30" />
        </div>
      </div>
    </div>
  );
}

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`;
}

function clampPercent(percent: number): number {
  return Math.max(0, Math.min(percent, 100));
}

function calculatePosition(percent: number): number {
  const clamped = clampPercent(percent);
  if (clamped === 100) return 100 + sliderMargin;
  if (clamped === 0) return -sliderMargin;
  return clamped;
}