import { PrismaClient } from "@prisma/client"
import "dotenv/config";

const prisma = new PrismaClient();

async function main() {
  const programsApiUrl = process.env.API_PROGRAM_INDEX_URL;
  const args = `?${process.env.API_COMMON_ARGS}&isarchived=false`;
  if (!programsApiUrl) {
    throw new Error("API_PROGRAM_INDEX_URL is not defined in the environment variables.");
  }
  const programs = (await (await fetch(`${programsApiUrl}${args}`)).json()).programs;


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