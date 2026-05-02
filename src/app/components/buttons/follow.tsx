import { FilledHeartIcon, HeartIcon } from "@/app/components/icons";
import { useState } from "react";
import type { ButtonIdInput } from "@/types";

export function FollowButton({ channelId, episodeId, className = "" }: ButtonIdInput): React.ReactNode {
  const [isFollowed, setIsFollowed] = useState<boolean>(false);

  const playId = !!channelId ? "channel-" : !!episodeId ? "episode-" : "" + (channelId ?? episodeId);
  if (!playId) { console.error("FollowButton requires either channelId or episodeId"); return null; }

  function onClick(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    setIsFollowed(!isFollowed);
  }

  return (
    <button className={` ${className}`} id={`follow-button-${playId}`} onClick={onClick} type="button">
      {isFollowed
        ? <FilledHeartIcon className="size-7 text-red-400" />
        : <HeartIcon className="size-7" />
      }
    </button>
  );
}