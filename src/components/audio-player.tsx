"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Slider } from "@shadcn/slider";
import { PlayButton } from "./play-button";
import { useAudioContext } from "./audio-context";

/** To make it easier to drag the progress slider to edge values, add some dead space at the start and end */
const sliderMargin = 9;

export function AudioPlayer({ className = "" }: { className?: string }) {
  const { audioPacket: packet, setAudioPacket } = useAudioContext();

  const audioRef = useRef<HTMLAudioElement>(typeof window !== "undefined" ? new Audio(packet.url || "") : null);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  /** When sliding the progress slider, use this to pause */
  const [isSliding, setIsSliding] = useState<boolean>(false);
  const [sliderPosition, setSliderPosition] = useState<number>(-sliderMargin);

  // Progress and duration as "mm:ss"
  const prettyProgress = formatTime(packet.progress);
  const prettyDuration = formatTime(packet.duration);

  /** On audio ref time update */
  const handleTimeUpdate = useCallback(() => {
    if (!audioRef.current) return;
    const updatedProgress = audioRef.current.currentTime;
    setAudioPacket({ ...packet, progress: updatedProgress });
  }, [packet, setAudioPacket]);

  /** On progress change */
  useEffect(() => {
    if (isSliding) return; // Ignore change when sliding

    const percent = (packet.progress / packet.duration) * 100;
    setSliderPosition(calculatePosition(percent));

    if (!audioRef.current) return;

    const delta = packet.progress - audioRef.current.currentTime;
    if (Math.abs(delta) < 0.1) return; // Avoid setting the time if it's already close enough

    audioRef.current.currentTime = packet.progress;
  }, [packet.progress, packet.duration, isSliding]);

  /** On url change */
  useEffect(() => {
    if (!audioRef.current) return;
    if (!packet.url) return;

    let isMounted = true;

    // For the visuals
    setIsPlaying(true);

    const handleWaiting = () => {
      if (!isMounted || !audioRef.current) return;
      setIsLoading(true);
    };
    const handlePlaying = () => {
      if (!isMounted || !audioRef.current) return;
      setIsLoading(false);
    };
    const handleCanPlay = () => {
      if (!isMounted || !audioRef.current) return;

      // Play new audio
      audioRef.current.play()
        .then(() => setIsPlaying(true))
        .catch((error) => {
          if (error.name === "AbortError") return; // Ignore abort errors
          console.error("Audio playback error:", error);
        });
    };

    // Loading visuals
    setIsLoading(true);
    audioRef.current.addEventListener("waiting", handleWaiting);
    audioRef.current.addEventListener("playing", handlePlaying);

    // On can play
    audioRef.current.addEventListener("canplaythrough", handleCanPlay);

    // Stop any current playback
    audioRef.current.pause();
    // Update the source
    audioRef.current.src = packet.url;
    // When ready, the previously registered listener will play the audio
    audioRef.current.load();
    audioRef.current.play();

    const currentAudio = audioRef.current;
    return () => {
      isMounted = false;
      if (currentAudio) {
        currentAudio.removeEventListener("waiting", handleWaiting);
        currentAudio.removeEventListener("playing", handlePlaying);
        currentAudio.removeEventListener("canplaythrough", handleCanPlay);
        currentAudio.pause();
        currentAudio.src = "";
        setIsPlaying(false);
      }
    }
  }, [packet.url]);

  /** On play button click */
  const handlePlay = useCallback(() => {
    if (!audioRef.current) return console.debug("No audio ref");;
    if (!packet.url) return console.debug("No url");;

    if (!audioRef.current.src) {
      console.debug("Setting url");
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
      audioRef.current.play();
      setIsPlaying(true);
    }

  }, [isPlaying, packet]);

  /** On slider change */
  const handleValueChange = useCallback((value: number[]) => {
    setIsSliding(true);

    setSliderPosition(value[0]);
  }, [setSliderPosition]);

  /** On slider commit */
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
      <audio className="hidden" ref={audioRef} onTimeUpdate={handleTimeUpdate} />

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