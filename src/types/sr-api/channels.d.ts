
export type SR_Channels_Response = {
  copyright: string;
  channels: {
    image: string;
    imagetemplate: string;
    color: string;
    tagline: string;
    siteurl: string;
    liveaudio: {
      id: number;
      url: string;
      statkey: string;
    };
    channeltype: string;
    id: number;
    name: string;
    scheduleurl?: string;
    xmltvid?: string;
  }[];
};
