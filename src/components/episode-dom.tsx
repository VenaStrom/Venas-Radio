"use client";

import Image from "next/image";
import PlayButton from "./play-button";
import ProgressBar from "./progress-bar";
import SRAttribute from "./sr-attribute";
import { useProgressStore } from "@/store/progress-store";
import { CSSProperties, useEffect, useState } from "react";
import type { Content } from "@/types/api/content";

const dateLocale: [Intl.LocalesArgument, Intl.DateTimeFormatOptions] = ["sv-SE", { timeZone: "Europe/Stockholm", day: "2-digit", month: "short" }];
const timeLocale: [Intl.LocalesArgument, Intl.DateTimeFormatOptions] = ["sv-SE", { timeZone: "Europe/Stockholm", hour12: false, hour: "2-digit", minute: "2-digit" }];

export default function EpisodeDOM({ episode, className, style }: { episode: Content, className?: string, style?: CSSProperties }) {
    const progressStore = useProgressStore();
    const [elapsed, setElapsed] = useState(0);
    const [percent, setPercent] = useState(0);

    const episodeProgress = progressStore.episodeProgressMap[episode.id]?.seconds || 0;

    useEffect(() => {
        if (episodeProgress) {
            setElapsed(episodeProgress / 60);
        }
    }, [episodeProgress]);

    useEffect(() => {
        const duration = Math.floor(episode.duration / 60);
        const newPercent = duration && elapsed ? Math.floor((elapsed / duration) * 100) : 0;
        setPercent(newPercent);
    }, [elapsed, episode]);

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

    const duration = Math.round(episode.duration / 60);
    const remainingMin = elapsed ? Math.ceil(duration - elapsed) : null;
    const remaining =
        remainingMin === 0 ? "\u00a0\u00a0\u00b7\u00a0\u00a0Lyssnad" :
            remainingMin !== null ? `\u00a0\u00a0\u00b7\u00a0\u00a0${remainingMin} min kvar` : "";

    return (
        <li className={`w-full grid grid-cols-[128px_1fr] grid-rows-[min_min_min_1fr] gap-2 ${className || ""}`} style={style} id={episode.id.toString()}>
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
                    {/* {formattedDate} {formattedTime}&nbsp;&nbsp;&middot;&nbsp;&nbsp;{duration} min {remaining !== null && remaining >= 0 ? `\u00a0\u00a0\u00b7\u00a0\u00a0${remaining} min kvar` : ""} */}
                    {formattedDate} {formattedTime}&nbsp;&nbsp;&middot;&nbsp;&nbsp;{duration} min {remaining}
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

                <PlayButton />
            </div>
        </li>
    );
}