import { SR_API } from "../src/types";
import { PrismaClient } from "@prisma/client"
import "dotenv/config";

const prisma = new PrismaClient();

async function programs(): Promise<SR_API.Program[]> {
  const args = `?${process.env.API_COMMON_ARGS}&isarchived=false`;
  const apiURL = process.env.API_PROGRAM_INDEX_URL + args;
  const programs: SR_API.Program[] = (await (await fetch(apiURL)).json()).programs;
  return new Promise(res => res(programs));
}

async function channels(): Promise<SR_API.Channel[]> {
  const args = `?${process.env.API_COMMON_ARGS}`;
  const apiURL = process.env.API_CHANNEL_INDEX_URL + args;
  const channels: SR_API.Channel[] = (await (await fetch(apiURL)).json()).channels;
  return new Promise(res => res(channels));
}

async function main() {
  const programsData = await programs();
  const channelsData = await channels();

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