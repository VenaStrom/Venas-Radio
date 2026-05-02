
export type SR_Episodes_Response = {
  copyright: string;
  episodes: {
    id: number;
    title: string;
    description: string;
    url: string;
    program: {
      id: number;
      name: string;
    };
    audiopreference: string;
    audiopriority: string;
    audiopresentation: string;
    publishdateutc: string;
    imageurl: string;
    imageurltemplate: string;
    photographer: string;
    broadcast: {
      availablestoputc: string;
      playlist: {
        duration: number;
        publishdateutc: string;
        id: number;
        url: string;
        statkey: string;
      };
      broadcastfiles: {
        duration: number;
        publishdateutc: string;
        id: number;
        url: string;
        statkey: string;
      }[];
    };
    broadcasttime: {
      starttimeutc: string;
      endtimeutc: string;
    };
    channelid: number;
  }[];
}[];
