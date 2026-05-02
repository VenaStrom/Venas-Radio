
export type SR_Programs_Response = {
  copyright: string;
  programs: {
    description: string;
    broadcastinfo?: string | undefined;
    email: string;
    phone: string;
    programurl: string;
    programslug?: string | undefined;
    programimage: string;
    programimagetemplate: string;
    programimagewide: string;
    programimagetemplatewide: string;
    socialimage: string;
    socialimagetemplate: string;
    archived: boolean;
    hasondemand: boolean;
    haspod: boolean;
    responsibleeditor: string;
    id: number;
    name: string;
    payoff?: string | undefined;
    socialmediaplatforms?: undefined;
  }[];
};
