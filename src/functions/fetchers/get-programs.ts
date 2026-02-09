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

export async function getPrograms({ search }: { search?: string } = {}) {
  "use cache";
  cacheTag("programs");

  const programs = await prisma.program.findMany({
    where: { archived: false, },
    orderBy: { name: "asc", },
  });

  const normalizedSearch = search?.trim();
  if (!normalizedSearch) {
    return programs;
  }

  const fuse = new Fuse(programs, { keys: programSearchKeys });
  return fuse.search(normalizedSearch).map((result) => result.item);
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