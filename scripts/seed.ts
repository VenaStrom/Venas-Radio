import fs from "node:fs";
import { prisma } from "@/api/lib/prisma";
import type { ChannelCreateManyInput, ProgramCategoryCreateManyInput, ProgramCreateManyInput } from "@/api/lib/prisma/generated";
import { isObj } from "@/types";
import { isSR_Channels_Response, isSR_Programs_Response } from "@/types/sr-api/type-guards";

const cacheDir = ".cache-seed";
const channelsCacheFile = `${cacheDir}/channels.json`;
const programsCacheFile = `${cacheDir}/programs.json`;

if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);

main()
  .finally(() => {
    prisma.$disconnect()
      .catch((err: unknown) => {
        console.error("Failed to disconnect Prisma client", err);
      });
    process.exit(0);
  })
  .catch((err: unknown) => {
    console.error(err);
    process.exit(1);
  });

async function main() {
  console.info("Seeding database...");

  await seedChannels();
  await seedPrograms();

  console.info("Database seeded successfully");
}

async function seedChannels() {
  const rawChannels = await fetchChannels();

  if (!isSR_Channels_Response(rawChannels)) {
    console.error("Invalid channels response", rawChannels);
    throw new Error("Invalid channels response");
  }

  const channels = rawChannels.channels;

  console.info(`Seeding ${channels.length} channels...`);

  const seeded = await prisma.channel.createMany({
    skipDuplicates: true,
    data: channels.map(c => ({
      id: c.id,
      name: c.name,
      tagline: c.tagline,
      siteUrl: c.siteurl,
      channelType: c.channeltype,
      color: c.color,
      image: c.image,
      imageTemplate: c.imagetemplate,
      scheduleUrl: c.scheduleurl,
      xmltvId: c.xmltvid,
    } satisfies ChannelCreateManyInput)),
  });

  console.info(`Seeded ${seeded.count} channels`);
}

async function seedPrograms() {
  const rawPrograms = await fetchPrograms();

  if (!isSR_Programs_Response(rawPrograms)) {
    console.error("Invalid programs response", rawPrograms);
    throw new Error("Invalid programs response");
  }

  const programs = rawPrograms.programs;

  console.info(`Seeding ${programs.length} programs...`);

  const categoriesById = new Map<number, ProgramCategoryCreateManyInput>();
  for (const p of programs) {
    if (p.programcategory) {
      categoriesById.set(
        p.programcategory.id,
        {
          id: p.programcategory.id,
          name: p.programcategory.name,
        } satisfies ProgramCategoryCreateManyInput,
      );
    }
  }

  const seededCategories = await prisma.programCategory.createMany({
    skipDuplicates: true,
    data: [...categoriesById.values()],
  });

  console.info(`Seeded ${seededCategories.count} program categories`);

  const seeded = await prisma.program.createMany({
    skipDuplicates: true,
    data: programs.map(p => ({
      id: p.id,
      name: p.name,
      archived: p.archived,
      broadcastInfo: p.broadcastinfo ?? null,
      channelId: p.channel.id,
      description: p.description,
      email: p.email,
      hasOnDemand: p.hasondemand,
      hasPod: p.haspod,
      payoff: p.payoff ?? null,
      phone: p.phone,
      programCategoryId: p.programcategory?.id ?? null,
      programImage: p.programimage,
      programImageTemplate: p.programimagetemplate,
      programImageTemplateWide: p.programimagetemplatewide,
      programImageWide: p.programimagewide,
      programSlug: p.programslug ?? null,
      programUrl: p.programurl,
      responsibleEditor: p.responsibleeditor,
      socialImage: p.socialimage,
      socialImageTemplate: p.socialimagetemplate,
    } satisfies ProgramCreateManyInput)),
  });

  console.info(`Seeded ${seeded.count} programs`);
}

async function fetchChannels(): Promise<Record<string, unknown>> {
  const cachedChannels = fs.existsSync(channelsCacheFile)
    ? JSON.parse(fs.readFileSync(channelsCacheFile, "utf-8")) as Record<string, unknown>
    : null;

  if (cachedChannels) {
    console.info(`Using cached channels ${channelsCacheFile.length} from`, channelsCacheFile);
    return cachedChannels;
  }

  console.info("Fetching channels from API...");

  const rawChannels = await fetch("https://api.sr.se/api/v2/channels?format=json&pagination=false")
    .catch((e: unknown) => {
      console.error("Failed to fetch channels", e);
      return null;
    })
    .then(res => res?.json())
    .then((data: unknown) => {
      if (!data || !isObj(data)) {
        console.error("Invalid channels response", data);
        return null;
      }
      return data;
    });

  if (!rawChannels) {
    console.error("Failed to fetch channels", rawChannels);
    throw new Error("Failed to fetch channels");
  }

  fs.writeFileSync(channelsCacheFile, JSON.stringify(rawChannels, null, 2));

  console.info(`Channels (${(rawChannels.channels as unknown[]).length}) saved to ${channelsCacheFile}`);

  return rawChannels;
}

async function fetchPrograms(): Promise<Record<string, unknown>> {
  const cachedPrograms = fs.existsSync(programsCacheFile)
    ? JSON.parse(fs.readFileSync(programsCacheFile, "utf-8")) as Record<string, unknown>
    : null;

  if (cachedPrograms) {
    console.info(`Using cached programs (${programsCacheFile.length}) from`, programsCacheFile);
    return cachedPrograms;
  }

  console.info("Fetching programs from API...");

  const rawPrograms = await fetch("https://api.sr.se/api/v2/programs/index?format=json&pagination=false&isarchived=false")
    .catch((e: unknown) => {
      console.error("Failed to fetch programs", e);
      return null;
    })
    .then(res => res?.json())
    .then((data: unknown) => {
      if (!data || !isObj(data)) {
        console.error("Invalid programs response", data);
        return null;
      }
      return data;
    });

  if (!rawPrograms) {
    console.error("Failed to fetch programs", rawPrograms);
    throw new Error("Failed to fetch programs");
  }

  fs.writeFileSync(programsCacheFile, JSON.stringify(rawPrograms, null, 2));

  console.info(`Programs (${(rawPrograms as { programs: unknown[] })["programs"].length}) saved to ${programsCacheFile}`);

  return rawPrograms;
}