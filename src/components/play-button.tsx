"use client";

import { Episode } from "@/types";
import { Button } from "@shadcn/button";
import * as Icon from "lucide-react";
import { useState } from "react";

export function PlayButton({ episode }: { episode: Episode }) {
  const [buttonState, setButtonState] = useState<"playing" | "paused">("paused");

  // Toggle on click
  const toggleButton = () => {
    setButtonState((prevState) => (prevState === "playing" ? "paused" : "playing"));
  };

  const handlePlay = () => {
    toggleButton();
    
    fetch("/api/progress", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId: "userId", // Replace with actual user ID
        episodeId: episode.id,
        progress: buttonState === "playing" ? 0 : episode.podfile.duration,
      }),
    });
  };

  return (
    <Button onClick={handlePlay} variant={"link"} className="!p-0 !m-1 size-5 hover:fill-zinc-100/50">
      {buttonState === "paused" ?
        <Icon.Play className="fill-zinc-100 size-full" />
        :
        <Icon.Pause className="fill-zinc-100 size-full" />
      }
    </Button>
  );
}