"use client";

import { HeartIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { usePlayContext } from "@/components/play-context/play-context-use";

export default function LikeButton({
  programID,
  channelID,
}: {
  programID?: number;
  channelID?: number;
}
) {
  const { followedPrograms, setFollowedPrograms, followedChannels, setFollowedChannels } = usePlayContext();
  const liked = useMemo(() => {
    return programID ? followedPrograms.includes(programID) || false :
      channelID ? followedChannels.includes(channelID) || false :
        false;
  }, [programID, channelID, followedPrograms, followedChannels]);

  const [highlighted, setHighlighted] = useState(liked); // Local UI state for immediate feedback
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setHighlighted(liked), [liked]); // Keep local state in sync with global state

  // Save state
  const toggleLike = () => {
    const isNowLiked = !liked;
    setHighlighted(isNowLiked);

    if (programID) {
      setFollowedPrograms(prev => {
        const newSet = new Set<number>(prev);
        if (isNowLiked) newSet.add(programID);
        else newSet.delete(programID);
        return Array.from(newSet);
      });
    }
    else if (channelID) {
      setFollowedChannels(prev => {
        const newSet = new Set<number>(prev);
        if (isNowLiked) newSet.add(channelID);
        else newSet.delete(channelID);
        return Array.from(newSet);
      });
    }
  };

  return (
    <button className="size-min">
      <HeartIcon
        className={highlighted ? "fill-[red] text-[red]" : "none"}
        size={28}
        onClick={toggleLike}
      />
    </button>
  );
}