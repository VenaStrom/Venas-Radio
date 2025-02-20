import { Episode } from "@/types/api/episode"
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export function extractDuration(episode: Episode): number | null {
    return (
        episode.listenpodfile?.duration
        ||
        episode.downloadpodfile?.duration
        ||
        null
    );
}