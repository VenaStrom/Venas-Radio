"use client";

import Image from "next/image";
import PlayButton, { PlayButtonSkeleton } from "./play-button";
import ProgressBar from "./progress-bar";
import SRAttribute from "./sr-attribute";
import { Episode, Seconds } from "@/types/types";
import { usePlayContext } from "./play-context/play-context-use";
import { useMemo } from "react";

const dateLocale: [Intl.LocalesArgument, Intl.DateTimeFormatOptions] = ["sv-SE", { timeZone: "Europe/Stockholm", day: "2-digit", month: "short" }];
const timeLocale: [Intl.LocalesArgument, Intl.DateTimeFormatOptions] = ["sv-SE", { timeZone: "Europe/Stockholm", hour12: false, hour: "2-digit", minute: "2-digit" }];

export default function EpisodeDOM({ episode }: { episode: Episode; }) {
  const { progressDB } = usePlayContext();

  const progress: Seconds = useMemo(() => progressDB[episode.id], [progressDB, episode.id]);
  const duration: Seconds = useMemo(() => episode.duration, [episode.duration]);

  // const progressStore = useProgressStore().episodeProgressMap[episode.id];
  // const elapsed = useMemo(() => progressStore?.seconds ? Math.floor(progressStore.seconds / 60) : 0, [progressStore]);
  // const percent = useMemo(() => {
  //   const duration = Math.floor(episode.duration / 60);
  //   return duration && elapsed ? Math.floor((elapsed / duration) * 100) : 0;
  // }, [elapsed, episode]);

  // // Date and time formatting
  // const formattedDate = useMemo(() => {
  //   let formattedDate = episode.publishDate.toISOString().slice(0, 10); // Time insensitive date to compare with today and yesterday
  //   const today = new Date().toISOString().slice(0, 10);
  //   const yesterday = new Date(new Date().setDate(new Date().getDate() - 1)).toISOString().slice(0, 10);

  //   if (formattedDate === today) {
  //     formattedDate = "Idag";
  //   } else if (formattedDate === yesterday) {
  //     formattedDate = "Igår";
  //   } else {
  //     formattedDate = episode.publishDate.toLocaleString(...dateLocale);
  //   }
  //   return formattedDate;
  // }, [episode.publishDate]);
  // const formattedTime = useMemo(() => episode.publishDate.toLocaleString(...timeLocale), [episode.publishDate]);

  // const duration = useMemo(() => Math.round(episode.duration / 60), [episode.duration]);
  // const remainingMin = useMemo(() => elapsed ? Math.ceil(duration - elapsed) : null, [elapsed, duration]);
  // const remaining = useMemo(() => {
  //   if (remainingMin === 0) return "Lyssnad";
  //   if (remainingMin !== null && remainingMin > 0) return `${remainingMin} min kvar`;
  //   return "";
  // }, [remainingMin]);

  return (
    <li className="w-full grid grid-cols-[128px_1fr] grid-rows-[min_min_min_1fr] gap-2" id={episode.id.toString()}>
      {/* SR Attribute */}
      <SRAttribute className="col-span-2" />

      {/* Thumbnail */}
      <Image width={128} height={72} src={""} overrideSrc={episode.image.wide} alt="Avsnittsbild" className="bg-zinc-600 rounded-md" fetchPriority="low"></Image>

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
          {formattedDate} {formattedTime}&nbsp;&nbsp;&middot;&nbsp;&nbsp;{duration} min{"\u00a0\u00a0\u00b7\u00a0\u00a0"}{remaining}
        </p>

        <PlayButton episodeData={episode} />
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
      <div className="bg-zinc-600 rounded-md w-[128px] h-[72px] animate-pulse"></div>

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