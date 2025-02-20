import { Episode } from "@/types/api/episode"
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function extractDuration(episode: Episode) {
  return episode.listenpodfile?.duration || episode.downloadpodfile?.duration || episode.broadcast?.broadcastfiles[0]?.duration || Infinity
}