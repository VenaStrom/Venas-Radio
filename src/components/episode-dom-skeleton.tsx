import { PlayButtonSkeleton } from "@/components/play-button";

export default function EpisodeDOMSkeleton() {
  return (
    <li className="w-full grid grid-cols-[128px_1fr] grid-rows-[min_min_min_1fr] gap-2">
      {/* SR Attribute */}
      <div className="col-span-2 h-5"></div>

      {/* Thumbnail */}
      <div className="bg-zinc-600 rounded-md w-32 h-18 animate-pulse"></div>

      {/* Header Text */}
      <div className="col-start-2"></div>

      {/* Description */}
      <div className="bg-zinc-600 rounded-md h-7 text-xs pt-1 font-normal overflow-hidden col-span-2 animate-pulse"></div>

      {/* Progress Bar */}
      <div className="col-span-2 rounded-sm animate-pulse">
        <div className="rounded-sm bg-zinc-600 h-2"></div>
      </div>

      {/* Metadata */}
      <div className="col-span-2 flex flex-row justify-between items-center">
        <div></div>

        <PlayButtonSkeleton />
      </div>
    </li>
  );
}
