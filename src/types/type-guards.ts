import type { Channel } from "@/api/lib/prisma/generated";

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

export function isChannel(value: unknown): value is Channel {
  if (!isObj(value)) return false;
  if (!("name" in value) || typeof value.name !== "string") {
    console.info(`Invalid channel: missing or invalid "name" property`, { name: value.name }, { value });
    return false;
  }
  if (!("id" in value) || typeof value.id !== "number") {
    console.info(`Invalid channel: missing or invalid "id" property`, { value });
    return false;
  }
  if (!("image" in value) || typeof value.image !== "string") {
    console.info(`Invalid channel: missing or invalid "image" property`, { value });
    return false;
  }
  if (!("imageTemplate" in value) || typeof value.imageTemplate !== "string") {
    console.info(`Invalid channel: missing or invalid "imageTemplate" property`, { value });
    return false;
  }
  if (!("color" in value) || typeof value.color !== "string") {
    console.info(`Invalid channel: missing or invalid "color" property`, { value });
    return false;
  }
  if (!("tagline" in value) || typeof value.tagline !== "string") {
    console.info(`Invalid channel: missing or invalid "tagline" property`, { value });
    return false;
  }
  if (!("siteUrl" in value) || typeof value.siteUrl !== "string") {
    console.info(`Invalid channel: missing or invalid "siteUrl" property`, { value });
    return false;
  }
  if (!("scheduleUrl" in value) || (typeof value.scheduleUrl !== "string" && value.scheduleUrl !== null)) {
    console.info(`Invalid channel: missing or invalid "scheduleUrl" property`, { value });
    return false;
  }
  if (!("channelType" in value) || typeof value.channelType !== "string") {
    console.info(`Invalid channel: missing or invalid "channelType" property`, { value });
    return false;
  }
  if (!("xmltvId" in value) || (typeof value.xmltvId !== "string" && value.xmltvId !== null)) {
    console.info(`Invalid channel: missing or invalid "xmltvId" property`, { value });
    return false;
  }
  if (!("userId" in value) || (typeof value.userId !== "number" && value.userId !== null)) {
    console.info(`Invalid channel: missing or invalid "userId" property`, { value });
    return false;
  }

  return true;
}