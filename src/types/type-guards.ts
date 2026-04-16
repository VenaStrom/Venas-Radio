import type { EpisodeWithProgram } from "@/types";

export function isObj(value: unknown): value is Record<string, unknown> {
  if (
    value === null
    || value === undefined
    || typeof value !== "object"
    || Array.isArray(value)
  ) {
    return false;
  }

  return true;
}

export function isEpisodeWithProgram(value: unknown): value is EpisodeWithProgram {
  if (!isObj(value)) {
    console.warn("Value is not an object:", value);
    return false;
  }

  // .program
  if (
    !("program" in value)
    || !isObj(value.program)
    || !("name" in value.program)
    || typeof value.program.name !== "string"
    || !("id" in value.program)
    || typeof value.program.id !== "string"
  ) {
    console.warn("Value does not have a valid 'program' property:", value);
    return false;
  }

  // .id
  if (!("id" in value) || typeof value.id !== "string") {
    console.warn("Value does not have a valid 'id' property:", value);
    return false;
  }

  // .duration
  if (!("duration" in value) || typeof value.duration !== "number") {
    console.warn("Value does not have a valid 'duration' property:", value);
    return false;
  }

  // .title
  if (!("title" in value) || typeof value.title !== "string") {
    console.warn("Value does not have a valid 'title' property:", value);
    return false;
  }

  // .description
  if (!("description" in value) || typeof value.description !== "string") {
    console.warn("Value does not have a valid 'description' property:", value);
    return false;
  }

  // .publish_date
  if (
    !("publish_date" in value)
    || !(value.publish_date instanceof Date)
    || isNaN(value.publish_date.getTime())
  ) {
    console.warn("Value does not have a valid 'publish_date' property:", value);
    return false;
  }

  // .image_square_url
  if (
    !("image_square_url" in value)
    || typeof value.image_square_url !== "string"
  ) {
    console.warn("Value does not have a valid 'image_square_url' property:", value);
    return false;
  }

  // .image_wide_url
  if (
    !("image_wide_url" in value)
    || typeof value.image_wide_url !== "string"
  ) {
    console.warn("Value does not have a valid 'image_wide_url' property:", value);
    return false;
  }

  // .external_audio_url
  if (
    !("external_audio_url" in value)
    || typeof value.external_audio_url !== "string"
  ) {
    console.warn("Value does not have a valid 'external_audio_url' property:", value);
    return false;
  }

  // .program_id
  if (
    !("program_id" in value)
    || typeof value.program_id !== "string"
  ) {
    console.warn("Value does not have a valid 'program_id' property:", value);
    return false;
  }

  return true;
}