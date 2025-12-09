"use client";

import Image from "next/image";
import PlayButton, { PlayButtonSkeleton } from "./play-button";
import ProgressBar from "./progress-bar";
import SRAttribute from "./sr-attribute";
import { Episode, PlaybackProgress, Seconds, Timestamp } from "@/types/types";
import { usePlayContext } from "./play-context/play-context-use";
import { useMemo } from "react";
import { getLocaleTime, getRelativeTimeString } from "@/lib/time-format";

export default function EpisodeDOM({ episode }: { episode: Episode; }) {
  const { progressDB } = usePlayContext();

  const progress = useMemo(() => {
    return new PlaybackProgress(episode.duration, progressDB[episode.id] || Seconds.from(0));
  }, [episode.id, episode.duration, progressDB]);

  const duration: Timestamp = useMemo(() => progress.durationTimestamp(), [progress]);
  const remaining: Timestamp = useMemo(() => progress.remainingTimestamp(), [progress]);
  const percent: number = useMemo(() => progress.elapsedPercentage, [progress]);

  // Date and time formatting
  const formattedDate = useMemo(() => getRelativeTimeString(episode.publishDate), [episode.publishDate]);
  const formattedTime = useMemo(() => getLocaleTime(episode.publishDate), [episode.publishDate]);

  const remainingTime = useMemo<React.ReactNode>(() => {
    const isUnlistened = percent === 0;
    const isListened = remaining.totalSeconds.toNumber() <= 0;
    const formattedDuration = duration.toFormattedString(
      duration.minutes.toNumber() == 0
        ? { minuteUnit: "hide" }
        : { secondUnit: "hide" }
    );
    const formattedRemaining = remaining.toFormattedString(
      remaining.minutes.toNumber() == 0
        ? { minuteUnit: "hide" }
        : { secondUnit: "hide" }
    );

    if (isUnlistened) return <>{formattedDuration}</>;
    if (isListened) return <>{formattedDuration}&nbsp;&nbsp;&middot;&nbsp;&nbsp;Lyssnad</>
    return <>{formattedRemaining} kvar</>
  }, [duration, percent, remaining]);

  return (
    <li className="w-full grid grid-cols-[128px_1fr] grid-rows-[min_min_min_1fr] gap-2" id={episode.id.toString()}>
      {/* SR Attribute */}
      <SRAttribute className="col-span-2" />

      {/* Thumbnail */}
      <Image
        width={128}
        height={72}
        className="bg-zinc-600 rounded-md"
        src={""}
        overrideSrc={(() => {
          const url = new URL(episode.image.wide);
          url.searchParams.set("w", "256");
          url.searchParams.set("h", "144");
          return url.toString();
        })()}
        alt="Avsnittsbild"
        fetchPriority="low"
      />

      {/* Header Text */}
      <div className="col-start-2">
        <p className="text-sm font-light overflow-hidden">{episode.program.name}</p>
        <p className="text-sm font-bold overflow-hidden">{episode.title}</p>
      </div>

      {/* Description */}
      <p className="text-xs pt-1 font-normal overflow-hidden col-span-2">{episode.description}</p>

      {/* Progress Bar */}
      <ProgressBar progress={percent} className="col-span-2 rounded-sm" innerClassName="rounded-sm" />

      {/* Metadata */}
      <div className="col-span-2 flex flex-row justify-between items-center">
        <p className="text-xs text-zinc-400">
          {formattedDate} {formattedTime}
          &nbsp;&nbsp;&middot;&nbsp;&nbsp;
          {remainingTime}
        </p>

        <PlayButton episodeID={episode.id} />
      </div>
    </li>
  );
}

export function EpisodeSkeleton() {
  return (
    <li className="w-full grid grid-cols-[128px_1fr] grid-rows-[min_min_min_1fr] gap-2">
      {/* SR Attribute */}
      <div className="col-span-2 h-5"></div>

      {/* Thumbnail */}
      <div className="bg-zinc-600 rounded-md w-32 h-[72px] animate-pulse"></div>

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