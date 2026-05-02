
export type SR_Channels_Response = {
  copyright: string;
  channels: {
    image: string;
    imagetemplate: string;
    color: string;
    tagline: string;
    siteurl: string;
    scheduleurl?: string | undefined;
    channeltype: string;
    xmltvid?: string | undefined;
    id: number;
    name: string;
  }[];
};
