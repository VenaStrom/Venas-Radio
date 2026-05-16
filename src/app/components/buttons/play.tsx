import { PauseIcon, PlayIcon } from "@/app/components/icons";
import { useState } from "react";
import { getPlayIdString, isPlayId, type ButtonIdInput } from "@/types";
import { usePlayContext } from "@/app/context/play-context";

export function PlayButton({ channelId, episodeId, programId, className = "" }: ButtonIdInput): React.ReactNode {
  const { play } = usePlayContext();
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  const IDs = { channelId, episodeId, programId };

  if (!isPlayId(IDs)) {
    console.error("FollowButton requires either channelId, episodeId or programId");
    return null;
  }

  const playId = getPlayIdString(IDs);

  function onClick(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    setIsPlaying(!isPlaying);
    if (channelId === undefined) play(IDs);
    else if (episodeId === undefined) play({ channelId });
    else console.error("PlayButton requires either channelId or episodeId, not both");
  }

  return (
    <button className={` ${className}`} id={`play-button-${playId}`} onClick={onClick} type="button">
      {isPlaying
        ? <PauseIcon className="size-7" />
        : <PlayIcon className="size-7" />
      }
    </button>
  );
}