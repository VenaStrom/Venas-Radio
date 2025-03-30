
export type User = {
  id: string;
  username: string;
  programs: Program[];
}

export type Program = {
  id: string;
  name: string;
  publishDate: Date;
}

export type Channel = {
  id: string;
  name: string;
  publishDate: Date;
}

/* 
 * SR API Types
 */
export interface SocialMediaPlatform {
  platform: string;
  platformurl: string;
}

export interface ChannelInfo {
  id: number;
  name: string;
  channeltype: string;
  image: string;
  imagetemplate: string;
  color: string;
  siteurl: string;
  liveaudio?: {
    id: number;
    url: string;
    statkey: string;
  };
}

export interface ProgramCategory {
  id: number;
  name: string;
}

export interface SRProgram {
  description: string;
  broadcastinfo?: string;
  email: string;
  phone: string;
  programurl: string;
  programslug?: string;
  programimage: string;
  programimagetemplate: string;
  programimagewide: string;
  programimagetemplatewide: string;
  socialimage: string;
  socialimagetemplate: string;
  socialmediaplatforms: SocialMediaPlatform[];
  channel: ChannelInfo;
  archived: boolean;
  hasondemand: boolean;
  haspod: boolean;
  responsibleeditor: string;
  id: number;
  name: string;
  programcategory?: ProgramCategory;
  payoff?: string;
}

export interface SR_API {
  Program: SRProgram;
}