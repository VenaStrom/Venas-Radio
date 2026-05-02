import { isObj } from "@/types/type-guards";

export function isChannel(candidate: unknown): candidate is Channel {
  if (!isObj(candidate)) return false;
  if (!("image" in candidate) || typeof candidate.image !== "string") {
    console.info("Invalid channel: missing or invalid 'image'", { candidate });
    return false;
  }
  if (!("imagetemplate" in candidate) || typeof candidate.imagetemplate !== "string") {
    console.info("Invalid channel: missing or invalid 'imagetemplate'", { candidate });
    return false;
  }
  if (!("color" in candidate) || typeof candidate.color !== "string") {
    console.info("Invalid channel: missing or invalid 'color'", { candidate });
    return false;
  }
  if (!("tagline" in candidate) || typeof candidate.tagline !== "string") {
    console.info("Invalid channel: missing or invalid 'tagline'", { candidate });
    return false;
  }
  if (!("siteurl" in candidate) || typeof candidate.siteurl !== "string") {
    console.info("Invalid channel: missing or invalid 'siteurl'", { candidate });
    return false;
  }
  if (!("liveaudio" in candidate) || typeof candidate.liveaudio !== "object" || candidate.liveaudio === null) {
    console.info("Invalid channel: missing or invalid 'liveaudio'", { candidate });
    return false;
  }
  const liveaudio = candidate.liveaudio;
  if (!("id" in liveaudio) || typeof liveaudio.id !== "number") {
    console.info("Invalid channel: missing or invalid 'liveaudio.id'", { candidate });
    return false;
  }
  if (!("url" in liveaudio) || typeof liveaudio.url !== "string") {
    console.info("Invalid channel: missing or invalid 'liveaudio.url'", { candidate });
    return false;
  }
  if (!("statkey" in liveaudio) || typeof liveaudio.statkey !== "string") {
    console.info("Invalid channel: missing or invalid 'liveaudio.statkey'", { candidate });
    return false;
  }
  if (!("scheduleurl" in candidate) || typeof candidate.scheduleurl !== "string") {
    console.info("Invalid channel: missing or invalid 'scheduleurl'", { candidate });
    return false;
  }
  if (!("channeltype" in candidate) || typeof candidate.channeltype !== "string") {
    console.info("Invalid channel: missing or invalid 'channeltype'", { candidate });
    return false;
  }
  if (!("xmltvid" in candidate) || typeof candidate.xmltvid !== "string") {
    console.info("Invalid channel: missing or invalid 'xmltvid'", { candidate });
    return false;
  }
  if (!("id" in candidate) || typeof candidate.id !== "number") {
    console.info("Invalid channel: missing or invalid 'id'", { candidate });
    return false;
  }
  if (!("name" in candidate) || typeof candidate.name !== "string") {
    console.info("Invalid channel: missing or invalid 'name'", { candidate });
    return false;
  }
  return true;
}

export function isEpisode(candidate: unknown): candidate is Episode {
  if (!isObj(candidate)) return false;
  if (!("id" in candidate) || typeof candidate.id !== "number") {
    console.info("Invalid episode: missing or invalid 'id'", { candidate });
    return false;
  }
  if (!("title" in candidate) || typeof candidate.title !== "string") {
    console.info("Invalid episode: missing or invalid 'title'", { candidate });
    return false;
  }
  if (!("description" in candidate) || typeof candidate.description !== "string") {
    console.info("Invalid episode: missing or invalid 'description'", { candidate });
    return false;
  }
  if (!("url" in candidate) || typeof candidate.url !== "string") {
    console.info("Invalid episode: missing or invalid 'url'", { candidate });
    return false;
  }
  if (!("program" in candidate) || typeof candidate.program !== "object" || candidate.program === null) {
    console.info("Invalid episode: missing or invalid 'program'", { candidate });
    return false;
  }
  const program = candidate.program;
  if (!("id" in program) || typeof program.id !== "number") {
    console.info("Invalid episode: missing or invalid 'program.id'", { candidate });
    return false;
  }
  if (!("name" in program) || typeof program.name !== "string") {
    console.info("Invalid episode: missing or invalid 'program.name'", { candidate });
    return false;
  }
  if (!("audiopreference" in candidate) || typeof candidate.audiopreference !== "string") {
    console.info("Invalid episode: missing or invalid 'audiopreference'", { candidate });
    return false;
  }
  if (!("audiopriority" in candidate) || typeof candidate.audiopriority !== "string") {
    console.info("Invalid episode: missing or invalid 'audiopriority'", { candidate });
    return false;
  }
  if (!("audiopresentation" in candidate) || typeof candidate.audiopresentation !== "string") {
    console.info("Invalid episode: missing or invalid 'audiopresentation'", { candidate });
    return false;
  }
  if (!("publishdateutc" in candidate) || typeof candidate.publishdateutc !== "string") {
    console.info("Invalid episode: missing or invalid 'publishdateutc'", { candidate });
    return false;
  }
  if (!("imageurl" in candidate) || typeof candidate.imageurl !== "string") {
    console.info("Invalid episode: missing or invalid 'imageurl'", { candidate });
    return false;
  }
  if (!("imageurltemplate" in candidate) || typeof candidate.imageurltemplate !== "string") {
    console.info("Invalid episode: missing or invalid 'imageurltemplate'", { candidate });
    return false;
  }
  if (!("photographer" in candidate) || typeof candidate.photographer !== "string") {
    console.info("Invalid episode: missing or invalid 'photographer'", { candidate });
    return false;
  }
  if (!("broadcast" in candidate) || typeof candidate.broadcast !== "object" || candidate.broadcast === null) {
    console.info("Invalid episode: missing or invalid 'broadcast'", { candidate });
    return false;
  }
  const broadcast = candidate.broadcast;
  if (!("availablestoputc" in broadcast) || typeof broadcast.availablestoputc !== "string") {
    console.info("Invalid episode: missing or invalid 'broadcast.availablestoputc'", { candidate });
    return false;
  }
  if (!("playlist" in broadcast) || typeof broadcast.playlist !== "object" || broadcast.playlist === null) {
    console.info("Invalid episode: missing or invalid 'broadcast.playlist'", { candidate });
    return false;
  }
  const playlist = broadcast.playlist;
  if (!("duration" in playlist) || typeof playlist.duration !== "number") {
    console.info("Invalid episode: missing or invalid 'broadcast.playlist.duration'", { candidate });
    return false;
  }
  if (!("publishdateutc" in playlist) || typeof playlist.publishdateutc !== "string") {
    console.info("Invalid episode: missing or invalid 'broadcast.playlist.publishdateutc'", { candidate });
    return false;
  }
  if (!("id" in playlist) || typeof playlist.id !== "number") {
    console.info("Invalid episode: missing or invalid 'broadcast.playlist.id'", { candidate });
    return false;
  }
  if (!("url" in playlist) || typeof playlist.url !== "string") {
    console.info("Invalid episode: missing or invalid 'broadcast.playlist.url'", { candidate });
    return false;
  }
  if (!("statkey" in playlist) || typeof playlist.statkey !== "string") {
    console.info("Invalid episode: missing or invalid 'broadcast.playlist.statkey'", { candidate });
    return false;
  }
  if (!("broadcastfiles" in broadcast) || !Array.isArray(broadcast.broadcastfiles)) {
    console.info("Invalid episode: missing or invalid 'broadcast.broadcastfiles'", { candidate });
    return false;
  }
  for (const file of broadcast.broadcastfiles) {
    if (typeof file !== "object" || file === null) {
      console.info("Invalid episode: 'broadcast.broadcastfiles' contains non-object", { candidate, file });
      return false;
    }
    if (!("duration" in file) || typeof file.duration !== "number") {
      console.info("Invalid episode: missing or invalid 'broadcast.broadcastfiles[].duration'", { candidate, file });
      return false;
    }
    if (!("publishdateutc" in file) || typeof file.publishdateutc !== "string") {
      console.info("Invalid episode: missing or invalid 'broadcast.broadcastfiles[].publishdateutc'", { candidate, file });
      return false;
    }
    if (!("id" in file) || typeof file.id !== "number") {
      console.info("Invalid episode: missing or invalid 'broadcast.broadcastfiles[].id'", { candidate, file });
      return false;
    }
    if (!("url" in file) || typeof file.url !== "string") {
      console.info("Invalid episode: missing or invalid 'broadcast.broadcastfiles[].url'", { candidate, file });
      return false;
    }
    if (!("statkey" in file) || typeof file.statkey !== "string") {
      console.info("Invalid episode: missing or invalid 'broadcast.broadcastfiles[].statkey'", { candidate, file });
      return false;
    }
  }
  if (!("broadcasttime" in candidate) || typeof candidate.broadcasttime !== "object" || candidate.broadcasttime === null) {
    console.info("Invalid episode: missing or invalid 'broadcasttime'", { candidate });
    return false;
  }
  const broadcasttime = candidate.broadcasttime;
  if (!("starttimeutc" in broadcasttime) || typeof broadcasttime.starttimeutc !== "string") {
    console.info("Invalid episode: missing or invalid 'broadcasttime.starttimeutc'", { candidate });
    return false;
  }
  if (!("endtimeutc" in broadcasttime) || typeof broadcasttime.endtimeutc !== "string") {
    console.info("Invalid episode: missing or invalid 'broadcasttime.endtimeutc'", { candidate });
    return false;
  }
  if (!("channelid" in candidate) || typeof candidate.channelid !== "number") {
    console.info("Invalid episode: missing or invalid 'channelid'", { candidate });
    return false;
  }
  return true;
}

type Channel = {
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
  scheduleurl: string;
  channeltype: string;
  xmltvid: string;
  id: number;
  name: string;
};

type Episode = {
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
};

type Program = {
  description: string;
  broadcastinfo: string;
  email: string;
  phone: string;
  programurl: string;
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
};