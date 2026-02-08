export type SR_Program = {
  description: string;
  broadcastinfo: string | undefined;
  email: string;
  phone: string | undefined;
  programurl: string | undefined;
  programslug: string;
  programimage: string;
  programimagetemplate: string;
  programimagewide: string;
  programimagetemplatewide: string;
  socialimage: string;
  socialimagetemplate: string;
  socialmediaplatforms: {
    platform: string;
    platformurl: string;
  };
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
};