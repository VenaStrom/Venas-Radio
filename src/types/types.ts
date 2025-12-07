import { __Seconds, __Minutes, __PlaybackProgress, __Timestamp } from "./time";

export class Seconds extends __Seconds { };
export class Minutes extends __Minutes { };
export class Timestamp extends __Timestamp { };
export class PlaybackProgress extends __PlaybackProgress { };

export type ProgressDB = Record<Episode["id"], Seconds>;
export type EpisodeDB = Record<Episode["id"], Episode>;
export type ChannelDB = Record<Channel["id"], Channel>;
export type ProgramDB = Record<Program["id"], Program>;

export type Episode = {
  id: number;
  title: string;
  description: string;
  image: {
    square: string;
    wide: string;
  };
  url: string;
  program: {
    id: number;
    name: string;
  }
  publishDate: Date;
  duration: Seconds;
};

export type Channel = {
  id: number;
  name: string;
  image: {
    square: string;
    wide: string;
  };
  color: string;
  tagline: string;
  siteUrl: string;
  url: string;
  scheduleUrl: string;
  channelType: string;
};

export type Program = {
  id: number;
  name: string;
  description: string;
  broadcastInfo: string;
  email: string;
  phone: string;
  programSlug: string;
  channelId: number;
  channelName: string;
  image: {
    square: string;
    wide: string;
  };
  archived: boolean;
  hasOnDemand: boolean;
  hasPod: boolean;
  responsibleEditor: string;
};

export type AudioPlayerMedia = {
  episodeID?: Episode["id"];
  channelID?: Channel["id"];
  type: "episode" | "channel";
  title: string;
  subtitle: string;
  url: string;
  image: string;
};