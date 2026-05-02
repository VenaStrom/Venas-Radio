import "dotenv/config";
import { makeMariaDBAdapter } from "@/api/lib/prisma/mariadb-adapter";
import { PrismaClient } from "../../../../prisma/generated/client";

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL environment variable is not set.");
const DATABASE_URL = process.env.DATABASE_URL;

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | null };

export const prisma = !!globalForPrisma.prisma
  ? globalForPrisma.prisma
  : new PrismaClient(makeMariaDBAdapter(DATABASE_URL));

const disconnect = () => {
  prisma.$disconnect()
    .catch((err: unknown) => {
      console.error("Error disconnecting from the database:", err);
    });
};

process.on("SIGINT", disconnect);
process.on("exit", disconnect);
process.on("beforeExit", disconnect);
process.on("uncaughtException", disconnect);