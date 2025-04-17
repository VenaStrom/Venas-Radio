import { Channel } from "@/types-dir/api/channel";
import { Episode } from "@/types-dir/api/episode";
import { Content } from "@/types-dir/api/content";

export type ChannelMap = Record<string, Channel>;
export type EpisodeMap = Record<string, Episode>;
export type EpisodeProgress = { seconds: number; finished: boolean };
export type ProgressMap = Record<string, EpisodeProgress>;
export type ContentMap = Record<string, Content>;