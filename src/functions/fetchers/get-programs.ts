"use server";

import "server-only";
import prisma from "@/lib/prisma";
import { cacheTag } from "next/cache";
import { Program } from "@prisma/client";
import Fuse from "fuse.js";

const programSearchKeys: { name: keyof Program; weight: number }[] = [
  { name: "name", weight: 0.7 },
  { name: "description", weight: 0.3 },
];

type GetProgramsOptions = {
  search?: string;
  userId?: string | null;
  preferredIds?: string[];
};

export async function getPrograms({ search, userId, preferredIds }: GetProgramsOptions = {}) {
  "use cache";
  cacheTag("programs");

  const programs = await prisma.program.findMany({
    where: { archived: false, },
    orderBy: { name: "asc", },
  });

  const normalizedUserId = userId?.trim();
  const preferred = (preferredIds || []).map((id) => id.trim()).filter(Boolean);
  let favoriteProgramIds: Set<string> | null = preferred.length > 0 ? new Set(preferred) : null;
  if (normalizedUserId) {
    const user = await prisma.user.findUnique({
      where: { id: normalizedUserId },
      select: { favorite_programs: { select: { id: true } } },
    });

    if (user?.favorite_programs?.length) {
      favoriteProgramIds = new Set([
        ...(favoriteProgramIds ? Array.from(favoriteProgramIds) : []),
        ...user.favorite_programs.map((program) => program.id),
      ]);
    }
  }

  const normalizedSearch = search?.trim();
  if (!normalizedSearch) {
    return orderProgramsByFavorites(programs, favoriteProgramIds);
  }

  const fuse = new Fuse(programs, { keys: programSearchKeys });
  const results = fuse.search(normalizedSearch).map((result) => result.item);
  return orderProgramsByFavorites(results, favoriteProgramIds);
}

function orderProgramsByFavorites(programs: Program[], favoriteProgramIds: Set<string> | null): Program[] {
  if (!favoriteProgramIds || favoriteProgramIds.size === 0) {
    return programs;
  }

  const favorites: Program[] = [];
  const others: Program[] = [];
  for (const program of programs) {
    if (favoriteProgramIds.has(program.id)) {
      favorites.push(program);
    } else {
      others.push(program);
    }
  }

  return favorites.concat(others);
}

export async function getProgramById(programId: string): Promise<Program | null> {
  "use cache";
  cacheTag("programs");

  const program = await prisma.program.findUnique({
    where: { id: programId, },
  });

  return program;
}

export async function getProgramsByIds(programIds: string[]): Promise<Program[]> {
  "use cache";
  cacheTag("programs");

  const programs = await prisma.program.findMany({
    where: { id: { in: programIds, }, archived: false, },
    orderBy: { name: "asc", },
  });

  return programs;
}