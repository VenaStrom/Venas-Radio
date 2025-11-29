import { Channel } from "@/types/api/channel";
import { Episode } from "@/types/api/episode";
import { Content } from "@/types/api/content";

export type ChannelMap = Record<string, Channel>;
export type EpisodeMap = Record<string, Episode>;
export type EpisodeProgress = { seconds: number; finished: boolean };
export type ProgressMap = Record<string, EpisodeProgress>;
export type ContentMap = Record<string, Content>;

export type PlayPause = "playing" | "paused";