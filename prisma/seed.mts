import { PrismaClient } from "@prisma/client"
import "dotenv/config";

// Custom ENV type extends the NodeJS ProcessEnv type to include PROGRAM_INDEX
type ENV = NodeJS.ProcessEnv & {
  PROGRAM_INDEX: string;
};
process.env = process.env as ENV;

const prisma = new PrismaClient();

async function main() {
  const programsApiUrl = process.env.PROGRAM_INDEX;
  const args = "?format=json&pagination=false&isarchived=false"
  if (!programsApiUrl) {
    throw new Error("PROGRAM_INDEX is not defined in the environment variables.");
  }
  const programs = (await (await fetch(`${programsApiUrl}${args}`)).json()).programs;

  console.debug(programs);
  console.debug(programs.length);
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