"use client";

import Image from "next/image";
import PlayButton from "./play-button";
import ProgressBar from "./progress-bar";
import SRAttribute from "./sr-attribute";
import type { Episode } from "@/types/episode";
import { useProgressStore } from "@/store/progress-store";
import { CSSProperties } from "react";

const dateLocale: [Intl.LocalesArgument, Intl.DateTimeFormatOptions] = ["sv-SE", { timeZone: "Europe/Stockholm", day: "2-digit", month: "short" }];
const timeLocale: [Intl.LocalesArgument, Intl.DateTimeFormatOptions] = ["sv-SE", { timeZone: "Europe/Stockholm", hour12: false, hour: "2-digit", minute: "2-digit" }];

export default function EpisodeDOM({ episode, className, style }: { episode: Episode, className?: string , style?: CSSProperties }) {
    const progressStore = useProgressStore();

    // Validate episode publish date
    if (!episode.publishDate) {
        console.error(`Episode ${episode.id} has no publish date.`);
        return <></>;
    }

    // Date and time formatting
    let formattedDate = episode.publishDate.toISOString().slice(0, 10); // Time insensitive date to compare with today and yesterday
    switch (formattedDate) {
        case new Date().toISOString().slice(0, 10): // Today
            formattedDate = "Idag";
            break;

        case new Date(new Date().setDate(new Date().getDate() - 1)).toISOString().slice(0, 10): // Yesterday
            formattedDate = "Igår";
            break;

        default:
            formattedDate = episode.publishDate.toLocaleString(...dateLocale);
            break;
    }
    const formattedTime = episode.publishDate.toLocaleString(...timeLocale);

    // Duration and progress
    let duration = null;
    let elapsed = null;
    let remaining = null;
    let percent = 0;
    const durationSource = episode?.listenpodfile?.duration || episode?.downloadpodfile?.duration || episode?.broadcast?.broadcastfiles[0]?.duration || null;
    const progressForEpisode = progressStore.episodeProgressMap[episode.id]?.seconds || 0;

    if (durationSource) {
        duration = Math.floor(durationSource / 60);
        elapsed = progressForEpisode / 60;
        remaining = duration && elapsed ? Math.floor(duration - elapsed) : null;
        percent = duration && elapsed ? Math.floor(elapsed / duration * 100) : 0;
    }

    return (
        <li className={`w-full grid grid-cols-[128px_1fr] grid-rows-[min_min_min_1fr] gap-2 ${className}`} style={style} id={episode.id.toString()}>
            {/* SR Attribute */}
            <SRAttribute className="col-span-2" />

            {/* Thumbnail */}
            <Image width={128} height={72} src={""} overrideSrc={episode.imageurltemplate} alt="Avsnittsbild" className="bg-zinc-600 rounded-md" fetchPriority="low"></Image>

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
                <p className="text-xs text-zinc-400">{formattedDate} {formattedTime}&nbsp;&nbsp;&middot;&nbsp;&nbsp;{duration} min {remaining ? `\u00A0\u00B7\u00A0${remaining} min kvar` : ""}</p>

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
            <div className="h-10 text-xs pt-1 font-normal overflow-hidden col-span-2 animate-pulse"></div>

            {/* Progress Bar */}
            <div className="col-span-2 rounded-sm animate-pulse">
                <div className="rounded-sm bg-zinc-600 h-2"></div>
            </div>

            {/* Metadata */}
            <div className="col-span-2 flex flex-row justify-between items-center">
                <div></div>

                <PlayButton />
            </div>
        </li>
    );
}