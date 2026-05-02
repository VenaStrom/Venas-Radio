export type JSONValue = { [key: string]: JSONValue } | JSONValue[] | string | number | boolean | null;

export type ButtonIdInput = {
  channelId: number,
  episodeId: never,
  className?: string,
} | {
  channelId: never,
  episodeId: number,
  className?: string,
};