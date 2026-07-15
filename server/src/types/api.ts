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
  /** SR's numeric id, as a string. Ids are opaque here; never do arithmetic on them. */
  id: string;
  name: string;
  tagline: string;
  image: string;
  /** Hex, e.g. "31a1bd". Used for per-channel accents. */
  color: string;
  /** Flattened from SR's nested liveaudio object. Always playable. */
  streamUrl: string;
};

export type ChannelsResponse = {
  channels: ChannelDto[];
  /** Total across all pages, not this page's length. */
  total: Int;
  /** Every channel id in order, so the client can render placeholders it has not paged in yet. */
  allIds: string[];
};

export type ProgramDto = {
  id: string;
  name: string;
  description: string;
  image: string;
  /** Null when SR lists a program against a channel its channels endpoint does not return. */
  channelId: string | null;
  hasPod: boolean;
};

export type ProgramsResponse = {
  programs: ProgramDto[];
  total: Int;
  allIds: string[];
};

export type ApiError = {
  error: string;
};

// --- Auth ---

/** What the app POSTs to /auth/discord/exchange to redeem a one-time code. */
export type ExchangeRequest = {
  /** The one-time code from the vradio://auth deep link. */
  code: string;
  /**
   * The PKCE verifier this device generated before opening the browser. It never
   * leaves the device until now, which is what makes intercepting the deep link
   * useless on its own.
   */
  verifier: string;
};

export type SessionDto = {
  /** Opaque bearer token. Send as `Authorization: Bearer <token>`. */
  token: string;
  /** Discord snowflake. 64-bit, hence a string. */
  userId: string;
  username: string;
  avatarUrl: string | null;
};

/** Who the current bearer token belongs to. */
export type MeDto = {
  userId: string;
  username: string;
  avatarUrl: string | null;
};
