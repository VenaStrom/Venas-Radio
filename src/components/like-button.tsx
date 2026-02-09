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
  const normalizedProgramId = typeof programID !== "undefined" ? programID.toString() : undefined;
  const normalizedChannelId = typeof channelID !== "undefined" ? channelID.toString() : undefined;

  const { followedPrograms, setFollowedPrograms, followedChannels, setFollowedChannels } = usePlayContext();
  const liked = useMemo(() => {
    return normalizedProgramId ? followedPrograms.includes(normalizedProgramId) || false :
      normalizedChannelId ? followedChannels.includes(normalizedChannelId) || false :
        false;
  }, [normalizedProgramId, normalizedChannelId, followedPrograms, followedChannels]);

  // Save state
  const toggleLike = () => {
    const isNowLiked = !liked;

    if (normalizedProgramId) {
      setFollowedPrograms((prev) => {
        const newSet = new Set<string>(prev);
        if (isNowLiked) newSet.add(normalizedProgramId);
        else newSet.delete(normalizedProgramId);
        return Array.from(newSet);
      });
    }
    else if (normalizedChannelId) {
      setFollowedChannels((prev) => {
        const newSet = new Set<string>(prev);
        if (isNowLiked) newSet.add(normalizedChannelId);
        else newSet.delete(normalizedChannelId);
        return Array.from(newSet);
      });
    }
  };

  return (
    <button className="size-min">
      <HeartIcon
        className={liked ? "fill-[red] text-[red]" : "none"}
        size={28}
        onClick={toggleLike}
      />
    </button>
  );
}