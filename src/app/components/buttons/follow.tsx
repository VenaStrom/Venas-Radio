import { FilledHeartIcon, HeartIcon } from "@/app/components/icons";
import { useState } from "react";
import type { ButtonIdInput } from "@/types";
import { getPlayIdString, isPlayId } from "@/types";

export function FollowButton({ channelId, episodeId, programId, className = "" }: ButtonIdInput): React.ReactNode {
  const [isFollowed, setIsFollowed] = useState<boolean>(false);

  const IDs = { channelId, episodeId, programId };

  if (!isPlayId(IDs)) {
    console.error("FollowButton requires either channelId, episodeId or programId");
    return null;
  }

  const playId = getPlayIdString(IDs);

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