import { PauseIcon, PlayIcon } from "@/app/components/icons";
import { useState } from "react";
import type { ButtonIdInput } from "@/types";
import { usePlayContext } from "@/app/context/play-context";

export function PlayButton({ channelId, episodeId, className = "" }: ButtonIdInput): React.ReactNode {
  const { play } = usePlayContext();
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  const playId = !!channelId ? "channel-" : !!episodeId ? "episode-" : "" + (channelId ?? episodeId);
  if (!playId) { console.error("FollowButton requires either channelId or episodeId"); return null; }

  function onClick(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    setIsPlaying(!isPlaying);
    if (channelId === undefined) play({ episodeId });
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