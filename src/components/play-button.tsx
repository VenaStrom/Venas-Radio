"use client";

import { Episode } from "@/types";
import { Button } from "@shadcn/button";
import * as Icon from "lucide-react";
import { useState } from "react";

export function PlayButton({ episode, userId, progress }: { episode: Episode, userId: string, progress: number }) {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [progressState, setProgressState] = useState<number>(progress);

  const handlePlay = () => {
    setIsPlaying((prevState) => !prevState);

    // fetch("/api/progress", {
    //   method: "POST",
    //   headers: {
    //     "Content-Type": "application/json",
    //   },
    //   body: JSON.stringify({
    //     userId: userId,
    //     episodeId: episode.id,
    //     progress: progress,
    //   }),
    // });

    
  };

  return (
    <Button onClick={handlePlay} variant={"link"} className="!p-0 !m-1 size-5 hover:fill-zinc-100/50">
      {isPlaying ?
        <Icon.Pause className="fill-zinc-100 size-full" />
        :
        <Icon.Play className="fill-zinc-100 size-full" />
      }
    </Button>
  );
}