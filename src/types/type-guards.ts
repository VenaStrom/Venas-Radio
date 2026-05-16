import type { Channel, Program } from "@/api/lib/prisma/generated";
import type { PlayId } from "@/types";

export function isObj(value: unknown): value is Record<string, unknown> {
  if (!value) {
    return false;
  }
  if (typeof value !== "object") {
    return false;
  }
  if (Array.isArray(value)) {
    return false;
  }
  return true;
}
export function isArr(value: unknown): value is unknown[] {
  if (!value) {
    return false;
  }
  if (typeof value !== "object") {
    return false;
  }
  if (!Array.isArray(value)) {
    return false;
  }
  return true;
}
export function isSet(value: unknown): value is Set<unknown> {
  if (!value) {
    return false;
  }
  if (typeof value !== "object") {
    return false;
  }
  if (!(value instanceof Set)) {
    return false;
  }
  return true;
}

export function isChannel(value: unknown): value is Channel {
  if (!isObj(value)) return false;
  if (!("name" in value) || typeof value.name !== "string") {
    console.debug(`Invalid channel: missing or invalid "name" property`, { name: value.name }, { value });
    return false;
  }
  if (!("id" in value) || typeof value.id !== "number") {
    console.debug(`Invalid channel: missing or invalid "id" property`, { value });
    return false;
  }
  if (!("image" in value) || typeof value.image !== "string") {
    console.debug(`Invalid channel: missing or invalid "image" property`, { value });
    return false;
  }
  if (!("imageTemplate" in value) || typeof value.imageTemplate !== "string") {
    console.debug(`Invalid channel: missing or invalid "imageTemplate" property`, { value });
    return false;
  }
  if (!("color" in value) || typeof value.color !== "string") {
    console.debug(`Invalid channel: missing or invalid "color" property`, { value });
    return false;
  }
  if (!("tagline" in value) || typeof value.tagline !== "string") {
    console.debug(`Invalid channel: missing or invalid "tagline" property`, { value });
    return false;
  }
  if (!("siteUrl" in value) || typeof value.siteUrl !== "string") {
    console.debug(`Invalid channel: missing or invalid "siteUrl" property`, { value });
    return false;
  }
  if (!("scheduleUrl" in value) || (typeof value.scheduleUrl !== "string" && value.scheduleUrl !== null)) {
    console.debug(`Invalid channel: missing or invalid "scheduleUrl" property`, { value });
    return false;
  }
  if (!("channelType" in value) || typeof value.channelType !== "string") {
    console.debug(`Invalid channel: missing or invalid "channelType" property`, { value });
    return false;
  }
  if (!("xmltvId" in value) || (typeof value.xmltvId !== "string" && value.xmltvId !== null)) {
    console.debug(`Invalid channel: missing or invalid "xmltvId" property`, { value });
    return false;
  }
  if (!("userId" in value) || (typeof value.userId !== "number" && value.userId !== null)) {
    console.debug(`Invalid channel: missing or invalid "userId" property`, { value });
    return false;
  }

  return true;
}

export function isProgram(value: unknown): value is Program {
  if (!isObj(value)) return false;
  if (!("name" in value) || typeof value.name !== "string") {
    console.debug(`Invalid program: missing or invalid "name" property`, { name: value.name }, { value });
    return false;
  }
  if (!("id" in value) || typeof value.id !== "number") {
    console.debug(`Invalid program: missing or invalid "id" property`, { value });
    return false;
  }
  if (!("userId" in value) || (typeof value.userId !== "number" && value.userId !== null)) {
    console.debug(`Invalid program: missing or invalid "userId" property`, { value });
    return false;
  }
  if (!("description" in value) || typeof value.description !== "string") {
    console.debug(`Invalid program: missing or invalid "description" property`, { value });
    return false;
  }
  if (!("email" in value) || typeof value.email !== "string") {
    console.debug(`Invalid program: missing or invalid "email" property`, { value });
    return false;
  }
  if (!("phone" in value) || typeof value.phone !== "string") {
    console.debug(`Invalid program: missing or invalid "phone" property`, { value });
    return false;
  }
  if (!("programUrl" in value) || typeof value.programUrl !== "string") {
    console.debug(`Invalid program: missing or invalid "programUrl" property`, { value });
    return false;
  }
  if (!("programSlug" in value) || (typeof value.programSlug !== "string" && value.programSlug !== null)) {
    console.debug(`Invalid program: missing or invalid "programSlug" property`, { value });
    return false;
  }
  if (!("broadcastInfo" in value) || (typeof value.broadcastInfo !== "string" && value.broadcastInfo !== null)) {
    console.debug(`Invalid program: missing or invalid "broadcastInfo" property`, { value });
    return false;
  }
  if (!("payoff" in value) || (typeof value.payoff !== "string" && value.payoff !== null)) {
    console.debug(`Invalid program: missing or invalid "payoff" property`, { value });
    return false;
  }
  if (!("programCategoryId" in value) || (typeof value.programCategoryId !== "number" && value.programCategoryId !== null)) {
    console.debug(`Invalid program: missing or invalid "programCategoryId" property`, { value });
    return false;
  }
  if (!("hasOnDemand" in value) || typeof value.hasOnDemand !== "boolean") {
    console.debug(`Invalid program: missing or invalid "hasOnDemand" property`, { value });
    return false;
  }
  if (!("hasPod" in value) || typeof value.hasPod !== "boolean") {
    console.debug(`Invalid program: missing or invalid "hasPod" property`, { value });
    return false;
  }
  if (!("archived" in value) || typeof value.archived !== "boolean") {
    console.debug(`Invalid program: missing or invalid "archived" property`, { value });
    return false;
  }
  if (!("programImage" in value) || typeof value.programImage !== "string") {
    console.debug(`Invalid program: missing or invalid "programImage" property`, { value });
    return false;
  }
  if (!("programImageTemplate" in value) || typeof value.programImageTemplate !== "string") {
    console.debug(`Invalid program: missing or invalid "programImageTemplate" property`, { value });
    return false;
  }
  if (!("programImageTemplateWide" in value) || typeof value.programImageTemplateWide !== "string") {
    console.debug(`Invalid program: missing or invalid "programImageTemplateWide" property`, { value });
    return false;
  }
  if (!("programImageWide" in value) || typeof value.programImageWide !== "string") {
    console.debug(`Invalid program: missing or invalid "programImageWide" property`, { value });
    return false;
  }
  if (!("socialImage" in value) || typeof value.socialImage !== "string") {
    console.debug(`Invalid program: missing or invalid "socialImage" property`, { value });
    return false;
  }
  if (!("socialImageTemplate" in value) || typeof value.socialImageTemplate !== "string") {
    console.debug(`Invalid program: missing or invalid "socialImageTemplate" property`, { value });
    return false;
  }
  if (!("responsibleEditor" in value) || typeof value.responsibleEditor !== "string") {
    console.debug(`Invalid program: missing or invalid "responsibleEditor" property`, { value });
    return false;
  }
  if (!("channelId" in value) || typeof value.channelId !== "number") {
    console.debug(`Invalid program: missing or invalid "channelId" property`, { value });
    return false;
  }

  return true;
}

export function isPlayId(value: unknown): value is PlayId {
  if (!isObj(value)) return false;

  const hasChannelId = "channelId" in value;
  const hasEpisodeId = "episodeId" in value;
  const hasProgramId = "programId" in value;

  if (hasChannelId) {
    if (typeof value.channelId !== "number") {
      console.debug(`Invalid PlayId: "channelId" property is not a number`, { value });
      return false;
    }
    if (hasEpisodeId || hasProgramId) {
      console.debug(`Invalid PlayId: cannot have "channelId" property together with "episodeId" or "programId"`, { value });
      return false;
    }
    return true;
  }

  if (hasEpisodeId) {
    if (typeof value.episodeId !== "number") {
      console.debug(`Invalid PlayId: "episodeId" property is not a number`, { value });
      return false;
    }
    if (hasChannelId || hasProgramId) {
      console.debug(`Invalid PlayId: cannot have "episodeId" property together with "channelId" or "programId"`, { value });
      return false;
    }
    return true;
  }

  if (hasProgramId) {
    if (typeof value.programId !== "number") {
      console.debug(`Invalid PlayId: "programId" property is not a number`, { value });
      return false;
    }
    if (hasChannelId || hasEpisodeId) {
      console.debug(`Invalid PlayId: cannot have "programId" property together with "channelId" or "episodeId"`, { value });
      return false;
    }
    return true;
  }

  console.debug(`Invalid PlayId: missing required "channelId", "episodeId", or "programId" property`, { value });
  return false;
}

export function getPlayIdString(playId: PlayId): string {
  if ("channelId" in playId) return `channel-${playId.channelId}`;
  if ("episodeId" in playId) return `episode-${playId.episodeId}`;
  if ("programId" in playId) return `program-${playId.programId}`;
  throw new Error("Invalid PlayId: missing required property");
}