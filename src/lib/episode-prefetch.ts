import prisma from "@/lib/prisma";
import { ensureEpisodeCached, getCacheTtlMs } from "@/lib/audio-cache";
import { fetchEpisodes } from "@/functions/external-fetchers/episode-fetcher";

const DEFAULT_WINDOW_DAYS = 14;
const DEFAULT_CONCURRENCY = 4;

type PrefetchOptions = {
  windowDays?: number;
  concurrency?: number;
};

function getWindowStartDate(windowDays: number) {
  const now = Date.now();
  return new Date(now - windowDays * 24 * 60 * 60 * 1000);
}

async function runWithLimit<T>(items: T[], limit: number, worker: (item: T) => Promise<void>) {
  const queue = [...items];
  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (queue.length > 0) {
      const item = queue.shift();
      if (!item) return;
      await worker(item);
    }
  });
  await Promise.all(runners);
}

export async function prefetchEpisodesForPrograms(programIds: string[], options: PrefetchOptions = {}) {
  if (programIds.length === 0) return { total: 0 };

  const windowDays = options.windowDays ?? DEFAULT_WINDOW_DAYS;
  const windowStart = getWindowStartDate(windowDays);

  const episodes = await prisma.episode.findMany({
    where: {
      program_id: { in: programIds },
      publish_date: { gte: windowStart },
    },
    select: { id: true, external_audio_url: true },
    orderBy: { publish_date: "desc" },
  });

  const ttlMs = getCacheTtlMs();
  const concurrency = options.concurrency ?? DEFAULT_CONCURRENCY;

  let total = 0;

  await runWithLimit(episodes, concurrency, async (episode) => {
    if (!episode.external_audio_url) return;
    try {
      await ensureEpisodeCached(episode.id, episode.external_audio_url, ttlMs);
      total += 1;
    }
    catch (error) {
      console.warn("Failed to prefetch episode audio", episode.id, error);
    }
  });

  return { total };
}

export async function refreshEpisodesForPrograms(programIds: string[], options: PrefetchOptions = {}) {
  if (programIds.length === 0) return { total: 0, synced: 0 };

  const windowDays = options.windowDays ?? DEFAULT_WINDOW_DAYS;
  const fromDate = getWindowStartDate(windowDays);
  const toDate = new Date();

  const numericProgramIds = programIds
    .map((id) => Number(id))
    .filter((id) => Number.isFinite(id) && id > 0);

  if (numericProgramIds.length === 0) {
    return { total: 0, synced: 0 };
  }

  const fetchedEpisodes = await fetchEpisodes(numericProgramIds, { fromDate, toDate });

  if (fetchedEpisodes.length > 0) {
    await prisma.$transaction(
      fetchedEpisodes.map((episode) =>
        prisma.episode.upsert({
          where: { id: episode.id },
          update: {
            title: episode.title,
            description: episode.description,
            external_audio_url: episode.external_audio_url,
            publish_date: episode.publish_date,
            duration: episode.duration,
            image_square_url: episode.image_square_url,
            image_wide_url: episode.image_wide_url,
            program_id: episode.program_id,
          },
          create: episode,
        })
      )
    );
  }

  const { total } = await prefetchEpisodesForPrograms(programIds, options);
  return { total, synced: fetchedEpisodes.length };
}

export async function prefetchFollowedProgramEpisodes(options: PrefetchOptions = {}) {
  const users = await prisma.user.findMany({
    select: { favorite_programs: { select: { id: true } } },
  });

  const programIds = Array.from(
    new Set(
      users.flatMap((user) => user.favorite_programs.map((program) => program.id)),
    ),
  );

  return refreshEpisodesForPrograms(programIds, options);
}
