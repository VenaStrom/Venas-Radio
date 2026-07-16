import type { AuthedRequest } from "@/api/lib/auth";
import type { ApiError, EpisodeProgressDto, UserStateDto } from "@/types/api";
import { requireAuth } from "@/api/lib/auth";
import { isObj } from "@/types";
import { prisma } from "@/api/lib/prisma";
import express from "express";

export const userStateRouter = express.Router();

async function readState(userId: string): Promise<UserStateDto> {
  const [progressRows, user] = await Promise.all([
    prisma.episodeProgress.findMany({ where: { user_id: userId } }),
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        favorite_programs: { select: { id: true } },
        favorite_channels: { select: { id: true } },
      },
    }),
  ]);

  return {
    progress: progressRows.map(row => ({
      episodeId: row.episode_id,
      seconds: row.progress,
      touchedAtMs: row.touched_at.getTime(),
    })),
    followedProgramIds: user?.favorite_programs.map(p => p.id) ?? [],
    followedChannelIds: user?.favorite_channels.map(c => c.id) ?? [],
  };
}

function parseIds(value: unknown): string[] | null {
  if (!Array.isArray(value)) return null;
  if (!value.every((id): id is string => typeof id === "string" && id !== "")) return null;
  return Array.from(new Set(value));
}

function parseProgress(value: unknown): EpisodeProgressDto[] | null {
  if (!Array.isArray(value)) return null;
  const entries: EpisodeProgressDto[] = [];
  for (const entry of value) {
    if (!isObj(entry)) return null;
    const { episodeId, seconds, touchedAtMs } = entry;
    if (typeof episodeId !== "string" || episodeId === "") return null;
    if (typeof seconds !== "number" || !Number.isFinite(seconds) || seconds < 0) return null;
    if (typeof touchedAtMs !== "number" || !Number.isInteger(touchedAtMs) || touchedAtMs <= 0) return null;
    entries.push({ episodeId, seconds, touchedAtMs });
  }
  return entries;
}

userStateRouter.get("/api/user-state", requireAuth, async (req: AuthedRequest, res) => {
  res.json(await readState(req.userId as string));
});

userStateRouter.put("/api/user-state", requireAuth, async (req: AuthedRequest, res) => {
  const userId = req.userId as string;
  const body: unknown = req.body;

  const progress = isObj(body) ? parseProgress(body.progress) : null;
  const programIds = isObj(body) ? parseIds(body.followedProgramIds) : null;
  const channelIds = isObj(body) ? parseIds(body.followedChannelIds) : null;
  if (progress === null || programIds === null || channelIds === null) {
    res.status(400).json({ error: "Body must be a UserStateDto." } satisfies ApiError);
    return;
  }

  // Progress can reference episodes this server never ingested (played long
  // ago, aged out of the feed window). Those entries are ignored gracefully:
  // the client keeps them locally, and they sync if the episode ever appears.
  const knownEpisodes = new Set(
    (await prisma.episode.findMany({
      where: { id: { in: progress.map(e => e.episodeId) } },
      select: { id: true },
    })).map(e => e.id),
  );
  const syncable = progress.filter(e => knownEpisodes.has(e.episodeId));

  // Per-episode last-write-wins: only entries newer than what is stored land.
  const stored = await prisma.episodeProgress.findMany({
    where: { user_id: userId, episode_id: { in: syncable.map(e => e.episodeId) } },
    select: { episode_id: true, touched_at: true },
  });
  const storedTouched = new Map(stored.map(row => [row.episode_id, row.touched_at.getTime()]));
  const newer = syncable.filter(e => e.touchedAtMs > (storedTouched.get(e.episodeId) ?? 0));

  // Favorites replace rather than union: a union can never unfollow. The
  // client unions local and remote once at sign-in, so nothing is lost there.
  const [knownPrograms, knownChannels] = await Promise.all([
    prisma.program.findMany({ where: { id: { in: programIds } }, select: { id: true } }),
    prisma.channel.findMany({ where: { id: { in: channelIds } }, select: { id: true } }),
  ]);

  await prisma.$transaction([
    ...newer.map(entry =>
      prisma.episodeProgress.upsert({
        where: { user_id_episode_id: { user_id: userId, episode_id: entry.episodeId } },
        update: { progress: entry.seconds, touched_at: new Date(entry.touchedAtMs) },
        create: {
          user_id: userId,
          episode_id: entry.episodeId,
          progress: entry.seconds,
          touched_at: new Date(entry.touchedAtMs),
        },
      }),
    ),
    prisma.user.update({
      where: { id: userId },
      data: {
        favorite_programs: { set: knownPrograms },
        favorite_channels: { set: knownChannels },
      },
    }),
  ]);

  res.json(await readState(userId));
});
