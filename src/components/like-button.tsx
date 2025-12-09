"use client";

import { HeartIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { usePlayContext } from "./play-context/play-context-use";

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

  // Save state
  const toggleLike = () => {
    const newState = !liked;
    setHighlighted(newState);

    if (programID) {
      setFollowedPrograms(prev =>
        [...newState
          ? new Set([...prev, programID])
          : new Set([...prev].filter(id => id !== programID))
        ]);
    }
    else if (channelID) {
      setFollowedChannels(prev =>
        [...newState
          ? new Set([...prev, channelID])
          : new Set([...prev].filter(id => id !== channelID))
        ]);
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