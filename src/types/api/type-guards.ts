import type { SR_Program } from "@/types/api/program";
import type { SR_Channel } from "@/types/api/channel";
import type { SR_Episode } from "@/types/api/episode";
import { isObj } from "@/types";

export function isSR_Program(value: unknown): value is SR_Program {
  if (!isObj(value)) {
    console.warn("Value is not an object:", value);
    return false;
  }

  // .description
  if (
    !("description" in value)
    || typeof value.description !== "string"
  ) {
    console.warn("SR_Program.description is not a string:", value);
    return false;
  }

  // .broadcastinfo
  if (
    "broadcastinfo" in value
    && value.broadcastinfo !== undefined
    && typeof value.broadcastinfo !== "string"
  ) {
    console.warn("SR_Program.broadcastinfo is not a string or undefined:", value);
    return false;
  }

  // .email
  if (
    !("email" in value)
    || typeof value.email !== "string"
  ) {
    console.warn("SR_Program.email is not a string:", value);
    return false;
  }

  // .phone
  if (
    !("phone" in value)
    || typeof value.phone !== "string"
  ) {
    console.warn("SR_Program.phone is not a string:", value);
    return false;
  }

  // .programurl
  if (
    !("programurl" in value)
    || typeof value.programurl !== "string"
  ) {
    console.warn("SR_Program.programurl is not a string:", value);
    return false;
  }

  // .programslug
  if (
    "programslug" in value
    && value.programslug !== undefined
    && typeof value.programslug !== "string"
  ) {
    console.warn("SR_Program.programslug is not a string or undefined:", value);
    return false;
  }

  // .programimage
  if (
    !("programimage" in value)
    || typeof value.programimage !== "string"
  ) {
    console.warn("SR_Program.programimage is not a string:", value);
    return false;
  }

  // .programimagetemplate
  if (
    !("programimagetemplate" in value)
    || typeof value.programimagetemplate !== "string"
  ) {
    console.warn("SR_Program.programimagetemplate is not a string:", value);
    return false;
  }

  // .programimagewide
  if (
    !("programimagewide" in value)
    || typeof value.programimagewide !== "string"
  ) {
    console.warn("SR_Program.programimagewide is not a string:", value);
    return false;
  }

  // .programimagetemplatewide
  if (
    !("programimagetemplatewide" in value)
    || typeof value.programimagetemplatewide !== "string"
  ) {
    console.warn("SR_Program.programimagetemplatewide is not a string:", value);
    return false;
  }

  // .socialimage
  if (
    !("socialimage" in value)
    || typeof value.socialimage !== "string"
  ) {
    console.warn("SR_Program.socialimage is not a string:", value);
    return false;
  }

  // .socialimagetemplate
  if (
    !("socialimagetemplate" in value)
    || typeof value.socialimagetemplate !== "string"
  ) {
    console.warn("SR_Program.socialimagetemplate is not a string:", value);
    return false;
  }

  // .socialmediaplatforms
  if (
    !("socialmediaplatforms" in value)
    || !Array.isArray(value.socialmediaplatforms)
    || !value.socialmediaplatforms.every((platform) => (
      isObj(platform)
      && "platform" in platform
      && typeof platform.platform === "string"
      && "platformurl" in platform
      && typeof platform.platformurl === "string"
    ))
  ) {
    console.warn("SR_Program.socialmediaplatforms is not valid:", value);
    return false;
  }

  // .channel
  if (
    !("channel" in value)
    || !isObj(value.channel)
    || !("id" in value.channel)
    || typeof value.channel.id !== "number"
    || !("name" in value.channel)
    || typeof value.channel.name !== "string"
  ) {
    console.warn("SR_Program.channel is not valid:", value);
    return false;
  }

  // .archived
  if (
    !("archived" in value)
    || typeof value.archived !== "boolean"
  ) {
    console.warn("SR_Program.archived is not a boolean:", value);
    return false;
  }

  // .hasondemand
  if (
    !("hasondemand" in value)
    || typeof value.hasondemand !== "boolean"
  ) {
    console.warn("SR_Program.hasondemand is not a boolean:", value);
    return false;
  }

  // .haspod
  if (
    !("haspod" in value)
    || typeof value.haspod !== "boolean"
  ) {
    console.warn("SR_Program.haspod is not a boolean:", value);
    return false;
  }

  // .responsibleeditor
  if (
    !("responsibleeditor" in value)
    || typeof value.responsibleeditor !== "string"
  ) {
    console.warn("SR_Program.responsibleeditor is not a string:", value);
    return false;
  }

  // .id
  if (
    !("id" in value)
    || typeof value.id !== "number"
  ) {
    console.warn("SR_Program.id is not a number:", value);
    return false;
  }

  // .name
  if (
    !("name" in value)
    || typeof value.name !== "string"
  ) {
    console.warn("SR_Program.name is not a string:", value);
    return false;
  }

  // .programcategory
  if (
    "programcategory" in value
    && value.programcategory !== undefined
    && (
      !isObj(value.programcategory)
      || !("id" in value.programcategory)
      || typeof value.programcategory.id !== "number"
      || !("name" in value.programcategory)
      || typeof value.programcategory.name !== "string"
    )
  ) {
    console.warn("SR_Program.programcategory is not valid:", value);
    return false;
  }

  // .payoff
  if (
    "payoff" in value
    && value.payoff !== undefined
    && typeof value.payoff !== "string"
  ) {
    console.warn("SR_Program.payoff is not a string or undefined:", value);
    return false;
  }

  return true;
}


export function isSR_Channel(value: unknown): value is SR_Channel {
  if (!isObj(value)) {
    console.warn("Value is not an object:", value);
    return false;
  }

  // .image
  if (
    !("image" in value)
    || typeof value.image !== "string"
  ) {
    console.warn("SR_Channel.image is not a string:", value);
    return false;
  }

  // .imagetemplate
  if (
    !("imagetemplate" in value)
    || typeof value.imagetemplate !== "string"
  ) {
    console.warn("SR_Channel.imagetemplate is not a string:", value);
    return false;
  }

  // .color
  if (
    !("color" in value)
    || typeof value.color !== "string"
  ) {
    console.warn("SR_Channel.color is not a string:", value);
    return false;
  }

  // .tagline
  if (
    !("tagline" in value)
    || typeof value.tagline !== "string"
  ) {
    console.warn("SR_Channel.tagline is not a string:", value);
    return false;
  }

  // .siteurl
  if (
    !("siteurl" in value)
    || typeof value.siteurl !== "string"
  ) {
    console.warn("SR_Channel.siteurl is not a string:", value);
    return false;
  }

  // .liveaudio
  if (
    !("liveaudio" in value)
    || !isObj(value.liveaudio)
    || !("id" in value.liveaudio)
    || typeof value.liveaudio.id !== "number"
    || !("url" in value.liveaudio)
    || typeof value.liveaudio.url !== "string"
    || !("statkey" in value.liveaudio)
    || typeof value.liveaudio.statkey !== "string"
  ) {
    console.warn("SR_Channel.liveaudio is not valid:", value);
    return false;
  }

  // .scheduleurl
  if (
    "scheduleurl" in value
    && value.scheduleurl !== undefined
    && typeof value.scheduleurl !== "string"
  ) {
    console.warn("SR_Channel.scheduleurl is not a string or undefined:", value);
    return false;
  }

  // .channeltype
  if (
    !("channeltype" in value)
    || typeof value.channeltype !== "string"
  ) {
    console.warn("SR_Channel.channeltype is not a string:", value);
    return false;
  }

  // .xmltvid
  if (
    "xmltvid" in value
    && value.xmltvid !== undefined
    && typeof value.xmltvid !== "string"
  ) {
    console.warn("SR_Channel.xmltvid is not a string or undefined:", value);
    return false;
  }

  // .id
  if (
    !("id" in value)
    || typeof value.id !== "number"
  ) {
    console.warn("SR_Channel.id is not a number:", value);
    return false;
  }

  // .name
  if (
    !("name" in value)
    || typeof value.name !== "string"
  ) {
    console.warn("SR_Channel.name is not a string:", value);
    return false;
  }

  return true;
}

function isSR_EpisodeAudioFile(value: unknown): boolean {
  return (
    isObj(value)
    && "title" in value
    && typeof value.title === "string"
    && "description" in value
    && typeof value.description === "string"
    && "filesizeinbytes" in value
    && typeof value.filesizeinbytes === "number"
    && "program" in value
    && isObj(value.program)
    && "id" in value.program
    && typeof value.program.id === "number"
    && "name" in value.program
    && typeof value.program.name === "string"
    && "availablefromutc" in value
    && typeof value.availablefromutc === "string"
    && "duration" in value
    && typeof value.duration === "number"
    && "publishdateutc" in value
    && typeof value.publishdateutc === "string"
    && "id" in value
    && typeof value.id === "number"
    && "url" in value
    && typeof value.url === "string"
    && "statkey" in value
    && typeof value.statkey === "string"
  );
}

function isSR_BroadcastFile(value: unknown): boolean {
  return (
    isObj(value)
    && "duration" in value
    && typeof value.duration === "number"
    && "publishdateutc" in value
    && typeof value.publishdateutc === "string"
    && "id" in value
    && typeof value.id === "number"
    && "url" in value
    && typeof value.url === "string"
    && "statkey" in value
    && typeof value.statkey === "string"
  );
}

export function isSR_Episode(value: unknown): value is SR_Episode {
  if (!isObj(value)) {
    console.warn("Value is not an object:", value);
    return false;
  }

  // .id
  if (
    !("id" in value)
    || typeof value.id !== "number"
  ) {
    console.warn("SR_Episode.id is not a number:", value);
    return false;
  }

  // .title
  if (
    !("title" in value)
    || typeof value.title !== "string"
  ) {
    console.warn("SR_Episode.title is not a string:", value);
    return false;
  }

  // .description
  if (
    !("description" in value)
    || typeof value.description !== "string"
  ) {
    console.warn("SR_Episode.description is not a string:", value);
    return false;
  }

  // .url
  if (
    !("url" in value)
    || typeof value.url !== "string"
  ) {
    console.warn("SR_Episode.url is not a string:", value);
    return false;
  }

  // .program
  if (
    !("program" in value)
    || !isObj(value.program)
    || !("id" in value.program)
    || typeof value.program.id !== "number"
    || !("name" in value.program)
    || typeof value.program.name !== "string"
  ) {
    console.warn("SR_Episode.program is not valid:", value);
    return false;
  }

  // .audiopreference
  if (
    !("audiopreference" in value)
    || typeof value.audiopreference !== "string"
  ) {
    console.warn("SR_Episode.audiopreference is not a string:", value);
    return false;
  }

  // .audiopriority
  if (
    !("audiopriority" in value)
    || typeof value.audiopriority !== "string"
  ) {
    console.warn("SR_Episode.audiopriority is not a string:", value);
    return false;
  }

  // .audiopresentation
  if (
    !("audiopresentation" in value)
    || typeof value.audiopresentation !== "string"
  ) {
    console.warn("SR_Episode.audiopresentation is not a string:", value);
    return false;
  }

  // .publishdateutc
  if (
    !("publishdateutc" in value)
    || typeof value.publishdateutc !== "string"
  ) {
    console.warn("SR_Episode.publishdateutc is not a string:", value);
    return false;
  }

  // .imageurl
  if (
    !("imageurl" in value)
    || typeof value.imageurl !== "string"
  ) {
    console.warn("SR_Episode.imageurl is not a string:", value);
    return false;
  }

  // .imageurltemplate
  if (
    !("imageurltemplate" in value)
    || typeof value.imageurltemplate !== "string"
  ) {
    console.warn("SR_Episode.imageurltemplate is not a string:", value);
    return false;
  }

  // .photographer
  if (
    "photographer" in value
    && value.photographer !== undefined
    && typeof value.photographer !== "string"
  ) {
    console.warn("SR_Episode.photographer is not a string or undefined:", value);
    return false;
  }

  // .listenpodfile
  if (
    "listenpodfile" in value
    && value.listenpodfile !== undefined
    && value.listenpodfile !== null
    && !isSR_EpisodeAudioFile(value.listenpodfile)
  ) {
    console.warn("SR_Episode.listenpodfile is not valid:", value);
    return false;
  }

  // .downloadpodfile
  if (
    "downloadpodfile" in value
    && value.downloadpodfile !== undefined
    && value.downloadpodfile !== null
    && !isSR_EpisodeAudioFile(value.downloadpodfile)
  ) {
    console.warn("SR_Episode.downloadpodfile is not valid:", value);
    return false;
  }

  // .broadcast
  if (
    "broadcast" in value
    && value.broadcast !== undefined
    && (
      !isObj(value.broadcast)
      || (
        "availablestoputc" in value.broadcast
        && value.broadcast.availablestoputc !== undefined
        && typeof value.broadcast.availablestoputc !== "string"
      )
      || !("playlist" in value.broadcast)
      || !isSR_BroadcastFile(value.broadcast.playlist)
      || !("broadcastfiles" in value.broadcast)
      || !Array.isArray(value.broadcast.broadcastfiles)
      || !value.broadcast.broadcastfiles.every(isSR_BroadcastFile)
    )
  ) {
    console.warn("SR_Episode.broadcast is not valid:", value);
    return false;
  }

  // .broadcasttime
  if (
    !("broadcasttime" in value)
    || !isObj(value.broadcasttime)
    || !("starttimeutc" in value.broadcasttime)
    || typeof value.broadcasttime.starttimeutc !== "string"
    || !("endtimeutc" in value.broadcasttime)
    || typeof value.broadcasttime.endtimeutc !== "string"
  ) {
    console.warn("SR_Episode.broadcasttime is not valid:", value);
    return false;
  }

  // .channelid
  if (
    "channelid" in value
    && value.channelid !== undefined
    && typeof value.channelid !== "number"
  ) {
    console.warn("SR_Episode.channelid is not a number or undefined:", value);
    return false;
  }

  return true;
}