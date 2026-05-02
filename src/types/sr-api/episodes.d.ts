
export type SR_Episodes_Response = {
  copyright: string;
  episodes: {
    id: number;
    title: string;
    description: string;
    url: string;
    audiopreference: string;
    audiopriority: string;
    audiopresentation: string;
    publishdateutc: string;
    imageurl: string;
    imageurltemplate: string;
    photographer: string;
    channelid: number;
  }[];
};
