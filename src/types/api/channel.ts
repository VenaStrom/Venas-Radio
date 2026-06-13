export type SR_Channel = SR_Channels_Response["channels"][number];
type SR_Channels_Response = {
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
    scheduleurl?: string;
    channeltype: string;
    xmltvid?: string;
    id: number;
    name: string;
  }[];
};
