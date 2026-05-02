import { PlayIcon } from "@/app/components/icons";
import { useState } from "react";

export function PlayButton({
  playId,
  className = "",
}: {
  playId: number,
  className?: string,
}): React.ReactNode {
  return (
    <button className={` ${className}`} id={`play-btn-${playId}`}>
      <PlayIcon className="size-7" />
    </button>
  );
}