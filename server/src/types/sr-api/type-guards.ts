import type { SR_Channels_Response, SR_Episodes_Response, SR_Programs_Response } from "@/types/sr-api";
import { isObj } from "@/types/type-guards";

export function isSR_Channels_Response(data: unknown): data is SR_Channels_Response {
  if (!isObj(data)) return false;
  if (!("copyright" in data) || typeof data.copyright !== "string") return false;
  if (!("channels" in data) || !Array.isArray(data.channels)) return false;

  for (const channel of data.channels) {
    if (!isObj(channel)) return false;
    if (!("image" in channel) || typeof channel.image !== "string") {
      console.info("Channel is missing image or image is not a string", { channel, data });
      return false;
    }
    if (!("imagetemplate" in channel) || typeof channel.imagetemplate !== "string") {
      console.info("Channel is missing imagetemplate or imagetemplate is not a string", { channel, data });
      return false;
    }
    if (!("color" in channel) || typeof channel.color !== "string") {
      console.info("Channel is missing color or color is not a string", { channel, data });
      return false;
    }
    if (!("tagline" in channel) || typeof channel.tagline !== "string") {
      console.info("Channel is missing tagline or tagline is not a string", { channel, data });
      return false;
    }
    if (!("siteurl" in channel) || typeof channel.siteurl !== "string") {
      console.info("Channel is missing siteurl or siteurl is not a string", { channel, data });
      return false;
    }
    if (!("liveaudio" in channel) || !isObj(channel.liveaudio)) {
      console.info("Channel is missing liveaudio or liveaudio is not an object", { channel, data });
      return false;
    }
    const liveaudio = channel.liveaudio;
    if (!("id" in liveaudio) || typeof liveaudio.id !== "number") {
      console.info("Liveaudio is missing id or id is not a number", { liveaudio, channel, data });
      return false;
    }
    if (!("url" in liveaudio) || typeof liveaudio.url !== "string") {
      console.info("Liveaudio is missing url or url is not a string", { liveaudio, channel, data });
      return false;
    }
    if (!("statkey" in liveaudio) || typeof liveaudio.statkey !== "string") {
      console.info("Liveaudio is missing statkey or statkey is not a string", { liveaudio, channel, data });
      return false;
    }
    if (("scheduleurl" in channel) && typeof channel.scheduleurl !== "string") {
      console.info("Channel scheduleurl is not a string", { channel, data });
      return false;
    }
    if (!("channeltype" in channel) || typeof channel.channeltype !== "string") {
      console.info("Channel is missing channeltype or channeltype is not a string", { channel, data });
      return false;
    }
    if (("xmltvid" in channel) && typeof channel.xmltvid !== "string") {
      console.info("Channel xmltvid is not a string", { channel, data });
      return false;
    }
    if (!("id" in channel) || typeof channel.id !== "number") {
      console.info("Channel is missing id or id is not a number", { channel, data });
      return false;
    }
    if (!("name" in channel) || typeof channel.name !== "string") {
      console.info("Channel is missing name or name is not a string", { channel, data });
      return false;
    }
  }
  return true;
}

export function isSR_Programs_Response(data: unknown): data is SR_Programs_Response {
  if (!isObj(data)) return false;
  if (!("copyright" in data) || typeof data.copyright !== "string") return false;
  if (!("programs" in data) || !Array.isArray(data.programs)) return false;

  for (const program of data.programs) {
    if (!isObj(program)) return false;
    if (!("description" in program) || typeof program.description !== "string") {
      console.info("Program is missing description or description is not a string", { program });
      return false;
    }
    if (("broadcastinfo" in program) && typeof program.broadcastinfo !== "string") {
      console.info("Program broadcastinfo is not a string", { program });
      return false;
    }
    if (!("email" in program) || typeof program.email !== "string") {
      console.info("Program is missing email or email is not a string", { program });
      return false;
    }
    if (!("phone" in program) || typeof program.phone !== "string") {
      console.info("Program is missing phone or phone is not a string", { program });
      return false;
    }
    if (!("programurl" in program) || typeof program.programurl !== "string") {
      console.info("Program is missing programurl or programurl is not a string", { program });
      return false;
    }
    if (("programslug" in program) && typeof program.programslug !== "string") {
      console.info("Program programslug is not a string", { program });
      return false;
    }
    if (!("programimage" in program) || typeof program.programimage !== "string") {
      console.info("Program is missing programimage or programimage is not a string", { program });
      return false;
    }
    if (!("programimagetemplate" in program) || typeof program.programimagetemplate !== "string") {
      console.info("Program is missing programimagetemplate or programimagetemplate is not a string", { program });
      return false;
    }
    if (!("programimagewide" in program) || typeof program.programimagewide !== "string") {
      console.info("Program is missing programimagewide or programimagewide is not a string", { program });
      return false;
    }
    if (!("programimagetemplatewide" in program) || typeof program.programimagetemplatewide !== "string") {
      console.info("Program is missing programimagetemplatewide or programimagetemplatewide is not a string", { program });
      return false;
    }
    if (!("socialimage" in program) || typeof program.socialimage !== "string") {
      console.info("Program is missing socialimage or socialimage is not a string", { program });
      return false;
    }
    if (!("socialimagetemplate" in program) || typeof program.socialimagetemplate !== "string") {
      console.info("Program is missing socialimagetemplate or socialimagetemplate is not a string", { program });
      return false;
    }
    if (!("socialmediaplatforms" in program) || !Array.isArray(program.socialmediaplatforms)) {
      console.info("Program is missing socialmediaplatforms or socialmediaplatforms is not an array", { program });
      return false;
    }
    for (const platform of program.socialmediaplatforms) {
      if (!isObj(platform)) return false;
      if (!("platform" in platform) || typeof platform.platform !== "string") {
        console.info("Socialmediaplatform is missing platform or platform is not a string", { platform, program });
        return false;
      }
      if (!("platformurl" in platform) || typeof platform.platformurl !== "string") {
        console.info("Socialmediaplatform is missing platformurl or platformurl is not a string", { platform, program });
        return false;
      }
    }
    if (!("channel" in program) || !isObj(program.channel)) {
      console.info("Program is missing channel or channel is not an object", { program });
      return false;
    }
    const channel = program.channel;
    if (!("id" in channel) || typeof channel.id !== "number") {
      console.info("Channel is missing id or id is not a number", { channel, program });
      return false;
    }
    if (!("name" in channel) || typeof channel.name !== "string") {
      console.info("Channel is missing name or name is not a string", { channel, program });
      return false;
    }
    if (!("archived" in program) || typeof program.archived !== "boolean") {
      console.info("Program is missing archived or archived is not a boolean", { program });
      return false;
    }
    if (!("hasondemand" in program) || typeof program.hasondemand !== "boolean") {
      console.info("Program is missing hasondemand or hasondemand is not a boolean", { program });
      return false;
    }
    if (!("haspod" in program) || typeof program.haspod !== "boolean") {
      console.info("Program is missing haspod or haspod is not a boolean", { program });
      return false;
    }
    if (!("responsibleeditor" in program) || typeof program.responsibleeditor !== "string") {
      console.info("Program is missing responsibleeditor or responsibleeditor is not a string", { program });
      return false;
    }
    if (!("id" in program) || typeof program.id !== "number") {
      console.info("Program is missing id or id is not a number", { program });
      return false;
    }
    if (!("name" in program) || typeof program.name !== "string") {
      console.info("Program is missing name or name is not a string", { program });
      return false;
    }
    if ("programcategory" in program) {
      if (!isObj(program.programcategory)) {
        console.info("Programcategory is not an object", { programCategory: program.programcategory, program });
        return false;
      }
      const programCategory = program.programcategory;
      if (!("id" in programCategory) || typeof programCategory.id !== "number") {
        console.info("Programcategory is missing id or id is not a number", { programCategory, program });
        return false;
      }
      if (!("name" in programCategory) || typeof programCategory.name !== "string") {
        console.info("Programcategory is missing name or name is not a string", { programCategory, program });
        return false;
      }
    }
    if (("payoff" in program) && typeof program.payoff !== "string") {
      console.info("Program payoff is not a string", { program });
      return false;
    }
  }
  return true;
}

export function isSR_Episodes_Response(data: unknown): data is SR_Episodes_Response {
  if (!isObj(data)) return false;
  if (!("copyright" in data) || typeof data.copyright !== "string") {
    console.info("Response is missing copyright or copyright is not a string", { data });
    return false;
  }
  if (!("episodes" in data) || !Array.isArray(data.episodes)) {
    console.info("Response is missing episodes or episodes is not an array", { data });
    return false;
  }
  for (const episode of data.episodes) {
    if (!isObj(episode)) return false;
    if (!("id" in episode) || typeof episode.id !== "number") {
      console.info("Episode is missing id or id is not a number", { episode, data });
      return false;
    }
    if (!("title" in episode) || typeof episode.title !== "string") {
      console.info("Episode is missing title or title is not a string", { episode, data });
      return false;
    }
    if (!("description" in episode) || typeof episode.description !== "string") {
      console.info("Episode is missing description or description is not a string", { episode, data });
      return false;
    }
    if (!("url" in episode) || typeof episode.url !== "string") {
      console.info("Episode is missing url or url is not a string", { episode, data });
      return false;
    }
    if (!("program" in episode) || !isObj(episode.program)) {
      console.info("Episode is missing program or program is not an object", { episode, data });
      return false;
    }
    const program = episode.program;
    if (!("id" in program) || typeof program.id !== "number") {
      console.info("Program is missing id or id is not a number", { program, episode, data });
      return false;
    }
    if (!("name" in program) || typeof program.name !== "string") {
      console.info("Program is missing name or name is not a string", { program, episode, data });
      return false;
    }
    if (!("audiopreference" in episode) || typeof episode.audiopreference !== "string") {
      console.info("Episode is missing audiopreference or audiopreference is not a string", { episode, data });
      return false;
    }
    if (!("audiopriority" in episode) || typeof episode.audiopriority !== "string") {
      console.info("Episode is missing audiopriority or audiopriority is not a string", { episode, data });
      return false;
    }
    if (!("audiopresentation" in episode) || typeof episode.audiopresentation !== "string") {
      console.info("Episode is missing audiopresentation or audiopresentation is not a string", { episode, data });
      return false;
    }
    if (!("publishdateutc" in episode) || typeof episode.publishdateutc !== "string") {
      console.info("Episode is missing publishdateutc or publishdateutc is not a string", { episode, data });
      return false;
    }
    if (!("imageurl" in episode) || typeof episode.imageurl !== "string") {
      console.info("Episode is missing imageurl or imageurl is not a string", { episode, data });
      return false;
    }
    if (!("imageurltemplate" in episode) || typeof episode.imageurltemplate !== "string") {
      console.info("Episode is missing imageurltemplate or imageurltemplate is not a string", { episode, data });
      return false;
    }
    if (!("photographer" in episode) || typeof episode.photographer !== "string") {
      console.info("Episode is missing photographer or photographer is not a string", { episode, data });
      return false;
    }
    if (!("broadcast" in episode) || !isObj(episode.broadcast)) {
      console.info("Episode is missing broadcast or broadcast is not an object", { episode, data });
      return false;
    }
    const broadcast = episode.broadcast;
    if (!("availablestoputc" in broadcast) || typeof broadcast.availablestoputc !== "string") {
      console.info("Broadcast is missing availablestoputc or availablestoputc is not a string", { broadcast, episode, data });
      return false;
    }
    if (!("playlist" in broadcast) || !isObj(broadcast.playlist)) {
      console.info("Broadcast is missing playlist or playlist is not an object", { broadcast, episode, data });
      return false;
    }
    const playlist = broadcast.playlist;
    if (!("duration" in playlist) || typeof playlist.duration !== "number") {
      console.info("Playlist is missing duration or duration is not a number", { playlist, broadcast, episode, data });
      return false;
    }
    if (!("publishdateutc" in playlist) || typeof playlist.publishdateutc !== "string") {
      console.info("Playlist is missing publishdateutc or publishdateutc is not a string", { playlist, broadcast, episode, data });
      return false;
    }
    if (!("id" in playlist) || typeof playlist.id !== "number") {
      console.info("Playlist is missing id or id is not a number", { playlist, broadcast, episode, data });
      return false;
    }
    if (!("url" in playlist) || typeof playlist.url !== "string") {
      console.info("Playlist is missing url or url is not a string", { playlist, broadcast, episode, data });
      return false;
    }
    if (!("statkey" in playlist) || typeof playlist.statkey !== "string") {
      console.info("Playlist is missing statkey or statkey is not a string", { playlist, broadcast, episode, data });
      return false;
    }
    if (!("broadcastfiles" in broadcast) || !Array.isArray(broadcast.broadcastfiles)) {
      console.info("Broadcast is missing broadcastfiles or broadcastfiles is not an array", { broadcast, episode, data });
      return false;
    }
    for (const file of broadcast.broadcastfiles) {
      if (!isObj(file)) return false;
      if (!("duration" in file) || typeof file.duration !== "number") {
        console.info("Broadcastfile is missing duration or duration is not a number", { file, broadcast, episode, data });
        return false;
      }
      if (!("publishdateutc" in file) || typeof file.publishdateutc !== "string") {
        console.info("Broadcastfile is missing publishdateutc or publishdateutc is not a string", { file, broadcast, episode, data });
        return false;
      }
      if (!("id" in file) || typeof file.id !== "number") {
        console.info("Broadcastfile is missing id or id is not a number", { file, broadcast, episode, data });
        return false;
      }
      if (!("url" in file) || typeof file.url !== "string") {
        console.info("Broadcastfile is missing url or url is not a string", { file, broadcast, episode, data });
        return false;
      }
      if (!("statkey" in file) || typeof file.statkey !== "string") {
        console.info("Broadcastfile is missing statkey or statkey is not a string", { file, broadcast, episode, data });
        return false;
      }
    }
    if (!("broadcasttime" in episode) || !isObj(episode.broadcasttime)) {
      console.info("Episode is missing broadcasttime or broadcasttime is not an object", { episode, data });
      return false;
    }
    const broadcasttime = episode.broadcasttime;
    if (!("starttimeutc" in broadcasttime) || typeof broadcasttime.starttimeutc !== "string") {
      console.info("Broadcasttime is missing starttimeutc or starttimeutc is not a string", { broadcasttime, episode, data });
      return false;
    }
    if (!("endtimeutc" in broadcasttime) || typeof broadcasttime.endtimeutc !== "string") {
      console.info("Broadcasttime is missing endtimeutc or endtimeutc is not a string", { broadcasttime, episode, data });
      return false;
    }
    if (!("channelid" in episode) || typeof episode.channelid !== "number") {
      console.info("Episode is missing channelid or channelid is not a number", { episode, data });
      return false;
    }
  }
  return true;
}