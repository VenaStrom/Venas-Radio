"use client";

import { PauseIcon, PlayIcon } from "lucide-react";
import { useEffect, useMemo } from "react";
import { usePlayContext } from "@/components/play-context/play-context-use";
import { Channel, EpisodeWithProgram } from "@/types/types";

export default function PlayButton({
  episodeID,
  channelID,
  episode,
  channel,
  iconSize = 32,
}: {
  episodeID?: string;
  channelID?: string;
  episode?: EpisodeWithProgram;
  channel?: Channel;
  iconSize?: number;
}) {
  const {
    isPlaying: globalIsPlaying,
    currentEpisode,
    currentChannel,
    pause,
    play,
    playEpisode,
    playChannel,
    registerEpisode,
    registerChannel,
  } = usePlayContext();

  useEffect(() => {
    if (episode) registerEpisode(episode);
  }, [episode, registerEpisode]);

  useEffect(() => {
    if (channel) registerChannel(channel);
  }, [channel, registerChannel]);

  const interactionType = useMemo<"episode" | "channel" | "controller" | null>(() => {
    if (episode || typeof episodeID !== "undefined") {
      return "episode";
    }
    if (channel || typeof channelID !== "undefined") {
      return "channel";
    }
    return "controller";
  }, [episode, channel, episodeID, channelID]);

  const id: string | "controller" = useMemo(() => {
    if (episode) return episode.id;
    if (channel) return channel.id;
    if (typeof episodeID !== "undefined") return episodeID;
    if (typeof channelID !== "undefined") return channelID;
    return "controller";
  }, [episode, channel, episodeID, channelID]);

  const isPlaying = useMemo(() => {
    switch (interactionType) {
      case "controller":
        return globalIsPlaying;

      case "episode":
        return globalIsPlaying && currentEpisode?.id === id;

      case "channel":
        return globalIsPlaying && currentChannel?.id === id;

      default:
        return false;
    }
  }, [currentChannel?.id, currentEpisode?.id, globalIsPlaying, id, interactionType]);

  const click = () => {
    // Determine action based on interaction type and current play state and id
    if (interactionType === "controller") {
      if (!currentEpisode?.id && !currentChannel?.id) {
        console.warn("No episode or channel is currently loaded to control.");
        return;
      }
      return globalIsPlaying ? pause() : play();
    }

    if (id === "controller") throw new Error("Invalid state: interactionType is not 'controller' but id is 'controller'.");

    if (isPlaying) {
      // Inferred that this media is the one playing, so pause it
      pause();
    }
    else {
      // Play the selected media
      if (interactionType === "episode") {
        playEpisode(id);
      }
      else if (interactionType === "channel") {
        playChannel(id);
      }
    }
  };

  return (
    <button id={id.toString()} onClick={click}>
      {
        isPlaying
          ? <PauseIcon size={iconSize} className="fill-zinc-100" />
          : <PlayIcon size={iconSize} className="fill-zinc-100" />
      }
    </button>
  );
}

export function PlayButtonSkeleton({ iconSize = 32 }: { iconSize?: number; }) {
  return (
    <button role="none">
      <PlayIcon size={iconSize} className="fill-zinc-100" />
    </button>
  );
}