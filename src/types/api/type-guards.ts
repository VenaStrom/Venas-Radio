import type { SR_Program } from "@/types/api/program";
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
    "phone" in value
    && value.phone !== undefined
    && typeof value.phone !== "string"
  ) {
    console.warn("SR_Program.phone is not a string or undefined:", value);
    return false;
  }

  // .programurl
  if (
    "programurl" in value
    && value.programurl !== undefined
    && typeof value.programurl !== "string"
  ) {
    console.warn("SR_Program.programurl is not a string or undefined:", value);
    return false;
  }

  // .programslug
  if (
    !("programslug" in value)
    || typeof value.programslug !== "string"
  ) {
    console.warn("SR_Program.programslug is not a string:", value);
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
    || !isObj(value.socialmediaplatforms)
    || !("platform" in value.socialmediaplatforms)
    || typeof value.socialmediaplatforms.platform !== "string"
    || !("platformurl" in value.socialmediaplatforms)
    || typeof value.socialmediaplatforms.platformurl !== "string"
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

  return true;
}