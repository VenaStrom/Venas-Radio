import { __Seconds, __Minutes, __PlaybackProgress, __Timestamp, __Hours } from "@/types/time";
import type { Prisma, Channel as PrismaChannel, Episode as PrismaEpisode, Program as PrismaProgram } from "@prisma/client";

export class Seconds extends __Seconds { };
export class Minutes extends __Minutes { };
export class Timestamp extends __Timestamp { };
export class PlaybackProgress extends __PlaybackProgress { };
export class Hours extends __Hours { };

export type Channel = PrismaChannel;
export type Program = PrismaProgram;
export type Episode = PrismaEpisode;

export type EpisodeWithProgram = Prisma.EpisodeGetPayload<{
  include: {
    program: {
      select: {
        id: true;
        name: true;
      },
    },
  },
}>;

export type ProgressDB = Record<Episode["id"], Seconds>;
export type EpisodeDB = Record<Episode["id"], EpisodeWithProgram>;
export type ChannelDB = Record<Channel["id"], Channel>;
export type ProgramDB = Record<Program["id"], Program>;

export type PlayableMedia = {
  type: "episode" | "channel";
  id: string;
  url: string;
  title: string;
  subtitle?: string | null;
  image?: string | null;
};