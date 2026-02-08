import "server-only";
import prisma from "@/lib/prisma";
import { fetchPrograms } from "@/functions/external-fetchers/program-fetcher";
import { Program } from "@/prisma/client/client";

export async function getPrograms() {
  "use cache";

  const programs: Program[] = [];

  await prisma.$transaction(async (prisma) => {
    const existingPrograms = await prisma.program.findMany({
      where: { archived: false, },
    });

    if (!existingPrograms.length) {
      // If no programs exist in the database, fetch and store them
      const programs = await fetchPrograms();

      if (programs.length) {
        const writtenPrograms = await prisma.program.createMany({
          data: programs,
          skipDuplicates: true,
        });
        console.info(`Fetched and stored ${writtenPrograms.count} programs in the database.`);
      }
    }

    const currentDBPrograms = await prisma.program.findMany({
      where: { archived: false, },
    });

    programs.push(...currentDBPrograms);
  });

  return programs;
}