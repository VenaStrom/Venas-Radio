"use client";

import Image from "next/image";
import PlayButton  from "@/components/play-button";
import ProgressBar from "@/components/progress-bar";
import SRAttribute from "@/components/sr-attribute";
import { EpisodeWithProgram, PlaybackProgress, Seconds, Timestamp } from "@/types/types";
import { usePlayContext } from "@/components/play-context/play-context-use";
import { useMemo, useSyncExternalStore } from "react";
import { getLocaleTime, getRelativeTimeString } from "@/lib/time-format";

export default function EpisodeDOM({ episode }: { episode: EpisodeWithProgram; }) {
  const { progressDB } = usePlayContext();

  const hasMounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  const progress = useMemo(() => {
    return new PlaybackProgress(episode.duration, progressDB[episode.id] || Seconds.from(0));
  }, [episode.id, episode.duration, progressDB]);

  const duration: Timestamp = useMemo(() => progress.durationTimestamp(), [progress]);
  const remaining: Timestamp = useMemo(() => progress.remainingTimestamp(), [progress]);
  const percent: number = useMemo(() => progress.elapsedPercentage, [progress]);

  const publishDate = useMemo(() => (
    episode.publish_date instanceof Date ? episode.publish_date : new Date(episode.publish_date)
  ), [episode.publish_date]);

  // Date and time formatting
  const formattedDate = useMemo(() => getRelativeTimeString(publishDate), [publishDate]);
  const formattedTime = useMemo(() => getLocaleTime(publishDate), [publishDate]);

  const formattedDuration = useMemo(() => duration.toFormattedString(
    duration.minutes.toNumber() == 0
      ? { minuteUnit: "hide" }
      : { secondUnit: "hide" }
  ), [duration]);

  const remainingTime = useMemo<React.ReactNode>(() => {
    const isUnlistened = percent === 0;
    const isListened = remaining.totalSeconds.toNumber() <= 0;
    const formattedRemaining = remaining.toFormattedString(
      remaining.minutes.toNumber() == 0
        ? { minuteUnit: "hide" }
        : { secondUnit: "hide" }
    );

    if (isUnlistened) return <>{formattedDuration}</>;
    if (isListened) return <>{formattedDuration}&nbsp;&nbsp;&middot;&nbsp;&nbsp;Lyssnad</>
    return <>{formattedRemaining} kvar</>
  }, [formattedDuration, percent, remaining]);

  const displayPercent = hasMounted ? percent : 0;
  const displayDate = hasMounted ? formattedDate : "";
  const displayTime = hasMounted ? formattedTime : "";
  const displayRemainingTime = hasMounted ? remainingTime : <>{formattedDuration}</>;

  return (
    <li className="w-full grid grid-cols-[128px_1fr] grid-rows-[min_min_min_1fr] gap-2" id={episode.id.toString()}>
      {/* SR Attribute */}
      <SRAttribute className="col-span-2" />

      {/* Thumbnail */}
      <Image
        width={128}
        height={72}
        className="bg-zinc-600 rounded-md"
        src={episode.image_wide_url}
        alt="Avsnittsbild"
        fetchPriority="low"
      />

      {/* Header Text */}
      <div className="col-start-2">
        <p className="text-sm font-light overflow-hidden">{episode.program?.name ?? "Okand"}</p>
        <p className="text-sm font-bold overflow-hidden">{episode.title}</p>
      </div>

      {/* Description */}
      <p className="text-xs pt-1 font-normal overflow-hidden col-span-2">{episode.description}</p>

      {/* Progress Bar */}
      <ProgressBar progress={displayPercent} className="col-span-2 rounded-sm" innerClassName="rounded-sm" />

      {/* Metadata */}
      <div className="col-span-2 flex flex-row justify-between items-center">
        <p className="text-xs text-zinc-400 mb-1">
          {displayDate} {displayTime}
          &nbsp;&nbsp;&middot;&nbsp;&nbsp;
          {displayRemainingTime}
        </p>

        <PlayButton episode={episode} />
      </div>
    </li>
  );
}