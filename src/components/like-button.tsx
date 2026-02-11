"use client";

import { HeartIcon } from "lucide-react";
import { useMemo } from "react";
import { usePlayContext } from "@/components/play-context/play-context-use";

export default function LikeButton({
  programID,
  channelID,
}: {
  programID?: string;
  channelID?: string;
}
) {
  const {
    followedPrograms,
    setFollowedPrograms,
    followedChannels,
    setFollowedChannels,
  } = usePlayContext();

  const isLiked = useMemo(() => {
    return programID
      ? followedPrograms.includes(programID) ?? false
      : channelID
        ? followedChannels.includes(channelID) ?? false
        : false;
  }, [programID, channelID, followedPrograms, followedChannels]);

  // Save state
  const toggleLike = () => {
    const isNowLiked = !isLiked;

    if (programID) {
      setFollowedPrograms((prev) => {
        const newSet = new Set<string>(prev);
        if (isNowLiked) newSet.add(programID);
        else newSet.delete(programID);
        return Array.from(newSet);
      });
    }
    else if (channelID) {
      setFollowedChannels((prev) => {
        const newSet = new Set<string>(prev);
        if (isNowLiked) newSet.add(channelID);
        else newSet.delete(channelID);
        return Array.from(newSet);
      });
    }
  };

  return (
    <button className="size-min">
      <HeartIcon
        className={isLiked ? "fill-[red] text-[red]" : "none"}
        size={28}
        onClick={toggleLike}
      />
    </button>
  );
}