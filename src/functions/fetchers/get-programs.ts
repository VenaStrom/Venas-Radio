"use server";

import "server-only";
import prisma from "@/lib/prisma";
import { cacheTag } from "next/cache";
import { Program } from "@/prisma/client/client";

export async function getPrograms() {
  "use cache";
  cacheTag("programs");

  const programs = await prisma.program.findMany({
    where: { archived: false, },
    orderBy: { name: "asc", },
  });

  return programs;
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