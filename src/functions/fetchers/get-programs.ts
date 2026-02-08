import prisma from "@/lib/prisma";
import { fetchPrograms } from "@/functions/external-fetchers/program-fetcher";

export async function getPrograms() {
  const existingPrograms = await prisma.program.findMany({
    where: { archived: false, },
  });

  if (!existingPrograms.length) {
    // If no programs exist in the database, fetch and store them
    const programs = await fetchPrograms();

    if (programs.length) {
      await prisma.program.createMany({
        data: programs,
        skipDuplicates: true,
      });
    }
  }

  return await prisma.program.findMany({
    where: { archived: false, },
  });
}