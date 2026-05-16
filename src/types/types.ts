export type JSONValue = { [key: string]: JSONValue } | JSONValue[] | string | number | boolean | null;

export type PlayId = {
  channelId: number,
  episodeId?: never,
  programId?: never,
} | {
  channelId?: never,
  episodeId: number,
  programId?: never,
} | {
  channelId?: never,
  episodeId?: never,
  programId: number,
};

export type ButtonIdInput = PlayId & {
  className?: string;
};