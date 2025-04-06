"use client";

import type { AudioPlayerPacket } from "@/types";
import { useCallback, useRef, useState } from "react";
import { Slider } from "@shadcn/slider";
import { PlayButton } from "./play-button";

export function AudioPlayer({ className = "", packet }: { className?: string, packet: AudioPlayerPacket | null }) {
  if (!packet) {
    // Default packet
    packet = {
      url: null,
      image: null,
      superTitle: null,
      title: "Spelar inget",
      subtitle: "Hitta ett avsnitt eller en kanal att lyssna på.",
      duration: 0,
      progress: 0,
    }
  }

  const audioRef = useRef<HTMLAudioElement>(null);

  /** Separate the actual and visual values of the slider. This is to avoid it being really difficult to reach edge values on mobile. */
  const sliderMargin = 9;
  const calculatePercentages = (value: number): { actual: number, visual: number } => {
    const clamped = Math.max(0, Math.min(value, 100));
    if (clamped === 100) return { actual: 100, visual: 100 + sliderMargin };
    if (clamped === 0) return { actual: 0, visual: -sliderMargin };
    return { actual: clamped, visual: clamped };
  };

  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [progressState, setProgressState] = useState<number>(packet.progress);
  const [durationState, setDurationState] = useState<number>(packet.duration);

  const [progressPercent, setPercent] = useState<number>((progressState / durationState) * 100);
  const [sliderPercent, setSliderValue] = useState<number>(calculatePercentages(progressPercent).visual);

  const handleValueChange = useCallback((value: number[]) => setSliderValue(value[0]), [setSliderValue]);
  const handleValueCommit = useCallback((value: number[]) => {
    const { actual, visual } = calculatePercentages(value[0]);
    setSliderValue(visual);
    setPercent(actual);

    setProgressState(actual * durationState / 100);
  }, [calculatePercentages]);

  // Progress and duration as "mm:ss"
  const progressSeconds = Math.floor(progressState % 60);
  const progressMinutes = Math.floor(progressState / 60);
  const durationSeconds = Math.floor(durationState % 60);
  const durationMinutes = Math.floor(durationState / 60);
  const prettyProgress = `${progressMinutes.toString().padStart(2, "0")}:${progressSeconds.toString().padStart(2, "0")}`;
  const prettyDuration = `${durationMinutes.toString().padStart(2, "0")}:${durationSeconds.toString().padStart(2, "0")}`;

  return (
    <div className="w-full flex flex-col">
      <div className="w-full flex flex-row">
        {/* Thumb style */}
        <style>{`
          *[data-slot='slider-thumb'] {
            z-index: 20;
            height: 64px;
            width: 96px;
            overflow: visible;
            opacity: 0;
          }`}
        </style>

        <Slider
          value={[sliderPercent]}
          min={-sliderMargin}
          max={100 + sliderMargin}
          className="**:rounded-none z-20 brightness-90 h-1"
          onValueCommit={handleValueCommit}
          onValueChange={handleValueChange}
        />
      </div>

      <div className="flex flex-col ps-3.5 pe-5 pt-3 pb-4">
        {/* Super title */}
        <p className={`text-xs overflow-hidden transition-all duration-100 ease-in-out ${packet.superTitle ? "h-4" : "h-0"}`}>
          <span className="text-xs font-light opacity-60">{packet.superTitle}</span>
        </p>

        <div className="flex flex-row items-center justify-between gap-x-5">
          {/* Title and subtitle */}
          <div>
            <p className="text-base font-bold">{packet.title}</p>
          </div>

          <p className="text-sm opacity-80">
            {prettyProgress}&nbsp;/&nbsp;{prettyDuration}
          </p>

          <PlayButton state={isPlaying ? "playing" : "paused"} className="size-7 z-30" />
        </div>
      </div>
    </div>
  );
}