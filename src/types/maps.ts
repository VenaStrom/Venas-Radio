import { Channel } from "@/types/api/channel";
import { Episode } from "@/types/api/episode";

export type ChannelMap = Record<string, Channel>;
export type EpisodeMap = Record<string, Episode>;
export type EpisodeProgress = { seconds: number; finished: boolean };
export type ProgressMap = { [episodeID: number]: EpisodeProgress };