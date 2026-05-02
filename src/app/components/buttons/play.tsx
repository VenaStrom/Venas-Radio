import { PauseIcon, PlayIcon } from "@/app/components/icons";
import { useState } from "react";
import type { ButtonIdInput } from "@/types";

export function PlayButton({ channelId, episodeId, className = "" }: ButtonIdInput): React.ReactNode {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  const playId = !!channelId ? "channel-" : !!episodeId ? "episode-" : "" + (channelId ?? episodeId);
  if (!playId) { console.error("FollowButton requires either channelId or episodeId"); return null; }

  function onClick(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    setIsPlaying(!isPlaying);
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