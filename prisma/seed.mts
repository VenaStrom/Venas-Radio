import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  // Create channels
  const channel1 = await prisma.channel.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      name: "P1",
    },
  })
  
  const channel2 = await prisma.channel.upsert({
    where: { id: 2 },
    update: {},
    create: {
      id: 2,
      name: "P2",
    },
  })
  
  // Create programs
  const program1 = await prisma.program.upsert({
    where: { id: 101 },
    update: {},
    create: {
      id: 101,
      name: "Ekot",
    },
  })
  
  const program2 = await prisma.program.upsert({
    where: { id: 102 },
    update: {},
    create: {
      id: 102,
      name: "P2 Dokumentär",
    },
  })
  
  // Create a test user
  const user = await prisma.user.upsert({
    where: { id: "user_xyAeKShtHwexR3W3sb43fSC8QXEomPQC" },
    update: {},
    create: {
      id: "user_xyAeKShtHwexR3W3sb43fSC8QXEomPQC",
      username: "Cool Username",
      programs: {
        connect: [{ id: program1.id }]
      }
    },
  })
  
  console.info({ channels: [channel1, channel2], programs: [program1, program2], user })
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })