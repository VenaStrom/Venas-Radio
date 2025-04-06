"use client";

import { Button } from "@shadcn/button";
import * as Icon from "lucide-react";
import { useState } from "react";

export function PlayButton({ className = "", state = "paused" }: { className?: string, state?: "playing" | "paused" }) {
  const [isPlaying, setIsPlaying] = useState<boolean>(state === "playing");

  const toggle = () => {
    setIsPlaying((prevState) => !prevState);
  };

  return (
    <Button data-is-playing={isPlaying} onClick={toggle} variant={"link"} className={`!p-0 !m-1 size-6 hover:fill-zinc-100/50 ${className}`}>
      {isPlaying ?
        <Icon.Pause className="fill-zinc-100 size-full" />
        :
        <Icon.Play className="fill-zinc-100 size-full" />
      }
    </Button>
  );
}