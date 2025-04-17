"use client";

import type { Episode, EpisodeProgress } from "@/types";
import { PlayButton, PlayButtonProps } from "@/components/play-button";
import { useAudioContext } from "@/components/audio-context";
import { useCallback } from "react";

export function EpisodePlayButton(
  {
    episodeId,
    progress,
    ...props
  }:
    PlayButtonProps
    & {
      episodeId: number;
      progress: EpisodeProgress | null;
    }
) {
  const { audioPacket: _, setAudioPacket } = useAudioContext();

  const handlePlay = useCallback(async () => {
    // Get episode data
    const [episodeData] = await Promise.all([
      fetch("/api/episode", {
        method: "POST",
        body: JSON.stringify({ episodeId }),
        headers: {
          "Content-Type": "application/json",
        },
      }).then((res) => res.json()) as Promise<Episode>,
    ]);

    // Update packet 
    setAudioPacket({
      title: episodeData.title,
      superTitle: episodeData.program.name,
      subtitle: "",
      url: episodeData.podfile.url,
      image: episodeData.imageSquare,
      duration: episodeData.podfile.duration,
      progress: progress?.progress || 0,
    });
  }, [episodeId, progress?.progress, setAudioPacket]);

  return (
    <PlayButton onClick={handlePlay} {...props} />
  );
}