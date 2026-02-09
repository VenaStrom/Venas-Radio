import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { refreshEpisodesForPrograms } from "@/lib/episode-prefetch";

type UserStatePayload = {
  progress?: Record<string, number>;
  followedPrograms?: string[];
  followedChannels?: string[];
};

function normalizeIdList(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  return input
    .map((id) => (typeof id === "string" || typeof id === "number" ? id.toString() : ""))
    .filter((id) => id.length > 0);
}

function normalizeProgress(input: unknown): Record<string, number> {
  if (!input || typeof input !== "object") return {};
  const entries = Object.entries(input as Record<string, unknown>);
  const normalized: Record<string, number> = {};
  for (const [episodeId, value] of entries) {
    const id = episodeId.toString();
    const numeric = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
    if (!id || !Number.isFinite(numeric)) continue;
    normalized[id] = numeric;
  }
  return normalized;
}

async function ensureUser(userId: string) {
  await prisma.user.upsert({
    where: { id: userId },
    update: {},
    create: { id: userId },
  });
}

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await ensureUser(userId);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      favorite_channels: { select: { id: true } },
      favorite_programs: { select: { id: true } },
      episode_progress: { select: { episode_id: true, progress: true } },
    },
  });

  if (!user) {
    return NextResponse.json({
      progress: {},
      followedPrograms: [],
      followedChannels: [],
    });
  }

  const progress = Object.fromEntries(
    user.episode_progress.map((entry) => [entry.episode_id, entry.progress])
  );

  return NextResponse.json({
    progress,
    followedPrograms: user.favorite_programs.map((program) => program.id),
    followedChannels: user.favorite_channels.map((channel) => channel.id),
  });
}

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: UserStatePayload | null = null;
  try {
    payload = (await request.json()) as UserStatePayload;
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  await ensureUser(userId);

  const followedPrograms = normalizeIdList(payload?.followedPrograms);
  const followedChannels = normalizeIdList(payload?.followedChannels);
  const progress = normalizeProgress(payload?.progress);

  const [validPrograms, validChannels, validEpisodes] = await prisma.$transaction([
    prisma.program.findMany({
      where: { id: { in: followedPrograms } },
      select: { id: true },
    }),
    prisma.channel.findMany({
      where: { id: { in: followedChannels } },
      select: { id: true },
    }),
    prisma.episode.findMany({
      where: { id: { in: Object.keys(progress) } },
      select: { id: true },
    }),
  ]);

  const validProgramIds = validPrograms.map((program) => program.id);
  const validChannelIds = validChannels.map((channel) => channel.id);
  const validEpisodeIds = new Set(validEpisodes.map((episode) => episode.id));

  await prisma.user.update({
    where: { id: userId },
    data: {
      favorite_programs: {
        set: validProgramIds.map((id) => ({ id })),
      },
      favorite_channels: {
        set: validChannelIds.map((id) => ({ id })),
      },
    },
  });

  const progressEntries = Object.entries(progress).filter(([episodeId]) => validEpisodeIds.has(episodeId));
  if (progressEntries.length > 0) {
    await prisma.$transaction(
      progressEntries.map(([episodeId, value]) =>
        prisma.episodeProgress.upsert({
          where: {
            user_id_episode_id: {
              user_id: userId,
              episode_id: episodeId,
            },
          },
          update: { progress: value },
          create: {
            user_id: userId,
            episode_id: episodeId,
            progress: value,
          },
        })
      )
    );
  }

  if (validProgramIds.length > 0) {
    void refreshEpisodesForPrograms(validProgramIds);
  }

  return NextResponse.json({ ok: true });
}
