"use client";

import type { AudioPlayerPacket } from "@/types";
import { useRef, useState } from "react";
import { Slider } from "@shadcn/slider";

export function AudioPlayer({ className = "", packet }: { className?: string, packet: AudioPlayerPacket | null }) {
  if (!packet) {
    // Default packet
    packet = {
      url: null,
      image: null,
      title: "Spelar inget",
      subtitle: "Hitta ett avsnitt eller en kanal att lyssna på",
      duration: 100,
      progress: 0,
    }
  }

  const audioRef = useRef<HTMLAudioElement>(null);
  const [percent, setPercent] = useState<number>(packet.progress);
  const [currentValue, setCurrentValue] = useState<number>(packet.progress);

  return (
    <div className="w-full flex flex-col">
      <div className="w-full flex flex-row">
        {/* Thumb style */}
        <style>{`
          *[data-slot='slider-thumb'] {
            z-index: 10;
            opacity: 0;
            height: 64px;
            width: 64px;
            overflow: visible !import;
          }`}
        </style>

        {/* Colored margin */}
        <span className={`h-[6px] flex-1 ${currentValue > 0 ? "bg-primary" : "bg-muted"}`}></span>

        <Slider
          defaultValue={[percent]}
          max={packet.duration}
          className="w-10/12 **:rounded-none"
          onValueCommit={(value) => {
            setPercent(value[0]);
          }}
          onValueChange={(value) => setCurrentValue(value[0])}
        />

        {/* Colored margin */}
        <span className={`h-[6px] flex-1 ${currentValue > 99.9 ? "bg-primary" : "bg-muted"}`}></span>
      </div>

      <p className="my-5">current:{currentValue} committed:{percent}</p>
    </div>
  );
}