
export type Program = {
  archived: boolean;
  broadcastinfo: string;
  description: string;
  email: string;
  hasondemand: boolean;
  haspod: boolean;
  id: number;
  name: string;
  phone: string;
  programimage: string;
  programimagetemplate: string;
  programimagetemplatewide: string;
  programimagewide: string;
  programslug: string;
  programurl: string;
  responsibleeditor: string;
  socialimage: string;
  socialimagetemplate: string;
  channel: {
    id: number;
    name: string;
  };
  socialmediaplatforms: {
    platform: string;
    platformurl: string;
  }[];
};
