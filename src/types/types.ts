
export type PlayPause = "playing" | "paused";

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
  duration: number;
};
export type EpisodeDB = Record<Episode["id"], Episode>;

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
export type ChannelDB = Record<Channel["id"], Channel>;

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
export type ProgramDB = Record<Program["id"], Program>;