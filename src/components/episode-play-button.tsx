"use client";

import type { Episode, EpisodeProgress } from "@/types";
import { PlayButton, PlayButtonProps } from "@/components/play-button";
import { useAudioContext } from "@/components/audio-context";
import { useCallback, useEffect, useState } from "react";

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
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const { audioPacket, setAudioPacket } = useAudioContext();

  /** Sync play button state */
  useEffect(() => {
    if (audioPacket.currentId === episodeId) {
      setIsPlaying(true);
    } else {
      setIsPlaying(false);
    }
  }, [audioPacket.currentId, episodeId]);

  /** On starting this episode */
  const handlePlay = useCallback(async () => {
    setIsPlaying(true);

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
      currentId: episodeId,
    });
  }, [episodeId, progress?.progress, setAudioPacket]);

  return (
    <PlayButton isPlaying={isPlaying} onClick={handlePlay} {...props} />
  );
}