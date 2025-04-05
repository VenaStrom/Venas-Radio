"use client";

import type { AudioPlayerPacket } from "@/types";
import { useCallback, useRef, useState } from "react";
import { Slider } from "@shadcn/slider";

export function AudioPlayer({ className = "", packet }: { className?: string, packet: AudioPlayerPacket | null }) {
  if (!packet) {
    // Default packet
    packet = {
      url: null,
      image: null,
      title: "Spelar inget",
      subtitle: "Hitta ett avsnitt eller en kanal att lyssna på",
      duration: 60,
      progress: 0,
    }
  }

  /** Separate the actual and visual values of the slider. This is to avoid it being really difficult to reach edge values on mobile. */
  const sliderMargin = 9;
  const calculateValues = (value: number): { actual: number, visual: number } => {
    const clamped = Math.max(0, Math.min(value, 100));
    if (clamped === 100) return { actual: 100, visual: 100 + sliderMargin };
    if (clamped === 0) return { actual: 0, visual: -sliderMargin };
    return { actual: clamped, visual: clamped };
  };

  const audioRef = useRef<HTMLAudioElement>(null);
  const [percent, setPercent] = useState<number>((packet.progress / packet.duration) * 100);
  const [sliderValue, setSliderValue] = useState<number>(calculateValues(percent).visual);

  const handleValueChange = useCallback((value: number[]) => setSliderValue(value[0]), []);
  const handleValueCommit = useCallback((value: number[]) => {
    const { actual, visual } = calculateValues(value[0]);
    setSliderValue(visual);
    setPercent(actual);
  }, [calculateValues]);

  return (
    <div className="w-full flex flex-col">
      <div className="w-full flex flex-row">
        {/* Thumb style */}
        <style>{`
          *[data-slot='slider-thumb'] {
            z-index: 10;
            height: 64px;
            width: 96px;
            overflow: visible;
            opacity: 0;
          }`}
        </style>

        <Slider
          value={[sliderValue]}
          min={-sliderMargin}
          max={100 + sliderMargin}
          className="**:rounded-none"
          onValueCommit={handleValueCommit}
          onValueChange={handleValueChange}
        />
      </div>

      <p className="my-5">
        percent: {percent.toFixed(2)}%
      </p>
    </div>
  );
}