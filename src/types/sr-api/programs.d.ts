
export type SR_Programs_Response = {
  copyright: string;
  programs: {
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
    socialmediaplatforms: {
      platform: string;
      platformurl: string;
    }[];
    channel: {
      id: number;
      name: string;
    };
    archived: boolean;
    hasondemand: boolean;
    haspod: boolean;
    responsibleeditor: string;
    id: number;
    name: string;
    broadcastinfo?: string;
    programslug?: string;
  }[];
};
