/**
 * The contract between this server and the Android client.
 *
 * This is hand-declared, not inferred: it is our own API, so its shape is a
 * decision rather than a discovery. `scripts/kotlin-dto-gen.ts` reads this file
 * and emits matching Kotlin, so the client cannot drift from it.
 *
 * Keep it narrow. Everything here is a field the app has to keep parsing across
 * releases it cannot hot-fix, so prefer flattening SR's shapes over exposing
 * them. Nothing from `api.sr.se` should ever be visible past this boundary.
 */

/** A `number` that is always a 32-bit integer. Generates Kotlin `Int`. */
export type Int = number;
/** A `number` that is an integer too large for 32 bits. Generates Kotlin `Long`. */
export type Long = number;
/** A `number` that may be fractional. Generates Kotlin `Double`. */
export type Double = number;

export type ChannelDto = {
  id: Int;
  name: string;
  tagline: string;
  image: string;
  /** Hex, e.g. "31a1bd". Used for per-channel accents. */
  color: string;
  /**
   * Flattened from LiveAudio.url. Null for channels with no live stream, which
   * the client must treat as unplayable rather than assume.
   */
  streamUrl: string | null;
};

export type ChannelsResponse = {
  channels: ChannelDto[];
  /** Total across all pages, not this page's length. */
  total: Int;
  /** Every channel id in order, so the client can render placeholders it has not paged in yet. */
  allIds: Int[];
};

export type ProgramDto = {
  id: Int;
  name: string;
  description: string;
  image: string;
  channelId: Int;
  hasPod: boolean;
};

export type ProgramsResponse = {
  programs: ProgramDto[];
  total: Int;
  allIds: Int[];
};

export type ApiError = {
  error: string;
};
