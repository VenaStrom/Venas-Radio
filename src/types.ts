import type { Episode as PrismaEpisode, Podfile as PrismaPodfile, Program as PrismaProgram, EpisodeProgress as PrismaEpisodeProgress } from "@prisma/client";

// Modified prisma types
export type Episode = PrismaEpisode & { podfile: PrismaPodfile } & { program: PrismaProgram };
export type EpisodeProgress = PrismaEpisodeProgress;

// eslint-disable-next-line no-unused-vars
export type SortFunction = (a: Episode, b: Episode) => number;

export type AudioPlayerPacket = {
  url: string | null;
  image: string | null;

  superTitle: string | null;
  // Title: bigger text, main descriptor of what is being played
  title: string;
  // Subtitle: smaller text, can be longer
  subtitle: string;

  progress: number;
  duration: number;
};

/* 
 * SR API Types
 */
// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace SR_API {
  export type Channel = SR_Channel;
  export type ProgramCategory = SR_ProgramCategory;
  export type Program = SR_Program;
  export type Episode = SR_Episode;
  export type PodEpisode = SR_EpisodePod;
  export type EpisodeBroadcast = SR_EpisodeBroadcast;
}
export type SR_SocialMediaPlatform = {
  platform: string;
  platformurl: string;
}

export type SR_ProgramCategory = {
  id: number;
  name: string;
}

export type SR_ProgramParentRef = {
  id: number;
  name: string;
}

export type SR_LiveAudio = {
  id: number;
  url: string;
  statkey: string;
}

export type SR_ChannelInfo = {
  id: number;
  name: string;
  channeltype: string;
  image: string;
  imagetemplate: string;
  color: string;
  tagline: string;
  siteurl: string;
  liveaudio: SR_LiveAudio;
  scheduleurl?: string;
  xmltvid?: string;
}

export type SR_ListenPodfile = {
  title: string;
  description: string;
  filesizeinbytes: number;
  program: SR_ProgramParentRef;
  availablefromutc: string;
  duration: number;
  publishdateutc: string;
  id: number;
  url: string;
  statkey: string;
}

export type SR_DownloadPodfile = {
  title: string;
  description: string;
  filesizeinbytes: number;
  program: SR_ProgramParentRef;
  availablefromutc: string;
  duration: number;
  publishdateutc: string;
  id: number;
  url: string;
  statkey: string;
}

export type SR_BroadcastPlaylist = {
  duration: number;
  publishdateutc: string;
  id: number;
  url: string;
  statkey: string;
}

export type SR_BroadcastFile = {
  duration: number;
  publishdateutc: string;
  id: number;
  url: string;
  statkey: string;
}

export type SR_Broadcast = {
  availablestoputc?: string;
  playlist: SR_BroadcastPlaylist;
  broadcastfiles: SR_BroadcastFile[];
}

export type SR_BroadcastTime = {
  starttimeutc: string;
  endtimeutc: string;
}

export type SR_Episode = {
  id: number;
  title: string;
  description: string;
  url: string;
  program: SR_ProgramParentRef;
  audiopreference: string;
  audiopriority: string;
  audiopresentation: string;
  publishdateutc: string;
  imageurl: string;
  imageurltemplate: string;
  broadcast?: SR_Broadcast;
  broadcasttime?: SR_BroadcastTime;
  listenpodfile?: SR_ListenPodfile;
  downloadpodfile?: SR_DownloadPodfile;
  photographer?: string;
  channelid?: number;
}

export type SR_EpisodePod = {
  id: number;
  title: string;
  description: string;
  url: string;
  program: SR_ProgramParentRef;
  audiopreference: string;
  audiopriority: string;
  audiopresentation: string;
  publishdateutc: string;
  imageurl: string;
  imageurltemplate: string;
  listenpodfile: SR_ListenPodfile;
  downloadpodfile: SR_DownloadPodfile;
  broadcasttime?: SR_BroadcastTime;
  photographer?: string;
  channelid?: number;
}

export type SR_EpisodeBroadcast = {
  id: number;
  title: string;
  description: string;
  url: string;
  program: SR_ProgramParentRef;
  audiopreference: string;
  audiopriority: string;
  audiopresentation: string;
  publishdateutc: string;
  imageurl: string;
  imageurltemplate: string;
  photographer: string;
  broadcast: SR_Broadcast;
  broadcasttime: SR_BroadcastTime;
  channelid: number;
}

export type SR_Program = {
  id: number;
  name: string;
  description: string;
  email: string;
  phone: string;
  programurl: string;
  programimage: string;
  programimagetemplate: string;
  programimagewide: string;
  programimagetemplatewide: string;
  socialimage: string;
  socialimagetemplate: string;
  socialmediaplatforms: SR_SocialMediaPlatform[];
  channel: SR_ChannelInfo;
  archived: boolean;
  hasondemand: boolean;
  haspod: boolean;
  responsibleeditor: string;
  broadcastinfo?: string;
  programslug?: string;
  programcategory?: SR_ProgramCategory;
  payoff?: string;
}

export type SR_Channel = {
  id: number;
  name: string;
  image: string;
  imagetemplate: string;
  color: string;
  tagline: string;
  siteurl: string;
  liveaudio: SR_LiveAudio;
  channeltype: string;
  scheduleurl?: string;
  xmltvid?: string;
}