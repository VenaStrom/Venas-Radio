export type JSONValue = { [key: string]: JSONValue } | JSONValue[] | string | number | boolean | null;

export type PlayId = {
  channelId: number,
  episodeId?: never,
} | {
  channelId?: never,
  episodeId: number,
};

export type ButtonIdInput = PlayId & {
  className?: string;
};