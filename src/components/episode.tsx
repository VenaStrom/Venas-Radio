import SRAttribute from "./sr-attribute";
import Image from "next/image";
import PlayButton from "./play-button";
import ProgressBar from "./progress-bar";
import type { Episode } from "@/types/episode";

export default function EpisodeDOM(episode: Episode, episodeData: { [episodeID: number]: Episode }, userTimeProgress: { [episodeID: number]: number }) {

    const episodeMetaData: { (episode: Episode): { publishDate: Date, formattedDate: string, formattedTime: string, duration: number | null, remaining: number | null, percent: number | null } } = (episode: Episode) => {
        const publishDate = new Date(parseInt(episode.publishdateutc.replace(/\D/g, "")))
        let formattedDate = publishDate.toISOString().slice(0, 10);

        if (formattedDate === new Date().toISOString().slice(0, 10)) {
            formattedDate = "Idag";
        }
        else {
            formattedDate = publishDate.toLocaleString("sv-SE", { timeZone: "Europe/Stockholm", day: "2-digit", month: "short" });
        }
        const formattedTime = publishDate.toLocaleString("sv-SE", { timeZone: "Europe/Stockholm", hour12: false, hour: "2-digit", minute: "2-digit" });

        const durationSource = episode?.listenpodfile?.duration || episode?.downloadpodfile?.duration || episode?.broadcast?.broadcastfiles[0]?.duration || null;
        const duration = durationSource ? Math.floor(durationSource / 60) : null;
        const elapsed = (userTimeProgress[episode.id] || 0) / 60;
        const remaining = duration && userTimeProgress[episode.id] ? Math.floor(duration - elapsed) : null;

        const percent = duration && remaining ? Math.floor(elapsed / duration * 100) : null;

        return { publishDate, formattedDate, formattedTime, duration, remaining, percent };
    };

    // Metadata
    const { publishDate, formattedDate, formattedTime, duration, remaining, percent } = episodeMetaData(episode);
    episodeData[episode.id].publishDate = publishDate;

    return (
        <div className="w-full grid grid-cols-[128px_1fr] grid-rows-[min_min_min_1fr] gap-2" id={episode.id.toString()}>
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
            <ProgressBar progress={percent || 0} className="col-span-2 rounded-sm" innerClassName="rounded-sm" />

            {/* Metadata */}
            <div className="col-span-2 flex flex-row justify-between items-center">
                <p className="text-xs text-zinc-400">{formattedDate} {formattedTime}&nbsp;&nbsp;&middot;&nbsp;&nbsp;{duration} min {remaining ? `\u00A0\u00B7\u00A0${remaining} min kvar` : ""}</p>

                <PlayButton episodeID={episode.id} />
            </div>
        </div>
    );
}

export function EpisodeDOMPlaceholder() {
    return (
        <div className="w-full grid grid-cols-[128px_1fr] grid-rows-[min_min_min_1fr] gap-2">
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
        </div>
    );
}