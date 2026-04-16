import { fetchChannels } from "@/functions/external-fetchers/channel-fetcher";
import { fetchPrograms } from "@/functions/external-fetchers/program-fetcher";
import prisma from "@/lib/prisma";

main()
  .catch((e) => {
    console.error("Error during seeding:", e);
  })
  .finally(() => {
    prisma.$disconnect();
  });

async function main() {
  const fetchedChannels = await fetchChannels();
  const channelIdsInDb = new Set<string>();
  if (fetchedChannels.length) {
    let count = 0;
    for (const channel of fetchedChannels) {
      await prisma.channel.upsert({
        where: { id: channel.id, },
        create: channel,
        update: channel,
      })
        .then(() => {
          count++;
          channelIdsInDb.add(channel.id);
        })
        .catch((e) => {
          console.error(`Error upserting channel with ID ${channel.id}:`, e);
        });
    }
    console.info(`Fetched and stored ${count} channels in the database.`);
  }
  else {
    console.warn("No channels were fetched to store in the database.");
  }

  if (channelIdsInDb.size === 0) {
    const existingChannels = await prisma.channel.findMany({ select: { id: true } });
    for (const ch of existingChannels) channelIdsInDb.add(ch.id);
  }

  const fetchedPrograms = await fetchPrograms();
  if (fetchedPrograms.length) {
    let count = 0;
    let missingChannelCount = 0;
    for (const program of fetchedPrograms) {
      const channelId = program.channel_id;
      const programData =
        channelId && !channelIdsInDb.has(channelId)
          ? { ...program, channel_id: null }
          : program;

      await prisma.program.upsert({
        where: { id: program.id, },
        create: programData,
        update: programData,
      })
        .then(() => {
          count++;
          if (channelId && programData.channel_id === null) missingChannelCount++;
        })
        .catch((e) => {
          console.error(`Error upserting program with ID ${program.id}:`, e);
        });
    }
    if (missingChannelCount > 0) {
      console.warn(
        `Nullified channel_id for ${missingChannelCount} programs because the referenced channel was not found in the database.`
      );
    }
    console.info(`Fetched and stored ${count} programs in the database.`);
  }
  else {
    console.warn("No programs were fetched to store in the database.");
  }
}