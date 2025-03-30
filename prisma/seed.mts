import { SR_API } from "../src/types";
import { PrismaClient, Program, Channel } from "@prisma/client"
import "dotenv/config";

const prisma = new PrismaClient();

async function fetchChannels(): Promise<SR_API.Channel[]> {
  const args = `?${process.env.API_COMMON_ARGS}`;
  const apiURL = process.env.API_CHANNEL_INDEX_URL + args;
  const channels: SR_API.Channel[] = (await (await fetch(apiURL)).json()).channels;
  return new Promise(res => res(channels));
}

async function fetchProgramCategories(): Promise<SR_API.ProgramCategory[]> {
  const args = `?${process.env.API_COMMON_ARGS}`;
  const apiURL = process.env.API_PROGRAM_CATEGORIES_INDEX_URL + args;
  const programCategories: SR_API.ProgramCategory[] = (await (await fetch(apiURL)).json()).programcategories;
  return new Promise(res => res(programCategories));
}

async function fetchPrograms(): Promise<SR_API.Program[]> {
  const args = `?${process.env.API_COMMON_ARGS}&isarchived=false`;
  const apiURL = process.env.API_PROGRAM_INDEX_URL + args;
  const programs: SR_API.Program[] = (await (await fetch(apiURL)).json()).programs;
  return new Promise(res => res(programs));
}

async function main() {
  /** Channels */
  const channelsDataInAPIFormat = await fetchChannels();
  // Format
  const channelsData: Channel[] = channelsDataInAPIFormat.map((channel) => ({
    id: channel.id,
    name: channel.name,
    image: channel.image,
    imageHD: channel.imagetemplate,
    color: channel.color,
    tagline: channel.tagline,
    liveAudioURL: channel.liveaudio.url,
    channelType: channel.channeltype,
    scheduleURL: channel.scheduleurl || null,
  }));
  // Write to database
  await prisma.channel.createMany({
    data: channelsData,
  });
  console.info("Channels seeded");

  
  /** Program Categories */
  const programCategoriesDataInAPIFormat = await fetchProgramCategories();
  // Format
  const programCategoriesData: SR_API.ProgramCategory[] = programCategoriesDataInAPIFormat.map((programCategory) => ({
    id: programCategory.id,
    name: programCategory.name,
  }));
  // Write to database
  await prisma.programCategory.createMany({
    data: programCategoriesData,
  });
  console.info("Program categories seeded");
  

  /** Programs */
  const programsDataInAPIFormat = await fetchPrograms();
  // Format
  const programsData: Program[] = programsDataInAPIFormat.map((program) => ({
    id: program.id,
    name: program.name,
    description: program.description,
    imageSquare: program.programimage,
    imageSquareHD: program.programimagetemplate,
    imageWide: program.programimagewide,
    imageWideHD: program.programimagetemplatewide,
    broadcastInfo: program.broadcastinfo || null,
    payoff: program.payoff || null,
    channelId: program.channel.id,
    programCategoryId: program.programcategory?.id || null,
    lastFetchUTC: new Date(),
  }));
  // Write to database
  await prisma.program.createMany({
    data: programsData,
  });
  console.info("Programs seeded");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });