"use server";

import "server-only";
import prisma from "@/lib/prisma";
import { cacheTag } from "next/cache";
import type { EpisodeWithProgram } from "@/types/types";
import Fuse, { FuseOptionKey } from "fuse.js";

const episodeSearchKeys: Array<FuseOptionKey<EpisodeWithProgram>> | { name: keyof EpisodeWithProgram; weight: number }[] = [
  { name: "title", weight: 0.6 },
  { name: "description", weight: 0.25 },
  { name: "program.name", weight: 0.15 },
];

type GetEpisodesOptions = {
  search?: string;
  programId?: string;
};

export async function getEpisodes({ search, programId }: GetEpisodesOptions = {}) {
  "use cache";
  cacheTag("episodes");

  const episodes = await prisma.episode.findMany({
    where: programId ? { program_id: programId } : undefined,
    include: { program: { select: { id: true, name: true } } },
    orderBy: { publish_date: "desc" },
  });

  const normalizedSearch = search?.trim();
  if (!normalizedSearch) {
    return episodes;
  }

  const fuse = new Fuse(episodes, { keys: episodeSearchKeys });
  return fuse.search(normalizedSearch).map((result) => result.item);
}

export async function getEpisodeById(episodeId: string): Promise<EpisodeWithProgram | null> {
  "use cache";
  cacheTag("episodes");

  const episode = await prisma.episode.findUnique({
    where: { id: episodeId },
    include: { program: { select: { id: true, name: true } } },
  });

  return episode;
}

export async function getEpisodesByIds(episodeIds: string[]): Promise<EpisodeWithProgram[]> {
  "use cache";
  cacheTag("episodes");

  const episodes = await prisma.episode.findMany({
    where: { id: { in: episodeIds } },
    include: { program: { select: { id: true, name: true } } },
    orderBy: { publish_date: "desc" },
  });

  return episodes;
}
