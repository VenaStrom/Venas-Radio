import { HeartIcon } from "@/app/components/icons";
import { useState } from "react";

export function FollowButton({ playId, className = "" }: { playId: number, className?: string }): React.ReactNode {
  const [isFollowed, setIsFollowed] = useState<boolean>(false);

  return (
    <button className={` ${className}`} id={`follow-btn-${playId}`}>
      {isFollowed
        ? <HeartIcon className="size-7 text-red-500" />
        : <HeartIcon className="size-7" />
      }
    </button>
  );
}