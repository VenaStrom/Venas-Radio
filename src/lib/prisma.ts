import "dotenv/config";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "@prisma/client";

const {
  DATABASE_URL,
} = process.env;
if (!DATABASE_URL) {
  throw new Error("DATABASE_URL is not defined in environment variables.");
}

const url = new URL(DATABASE_URL);
const adapter = new PrismaMariaDb({
  host: decodeURI(url.hostname),
  port: Number(decodeURI(url.port)),
  user: decodeURI(url.username),
  password: decodeURI(url.password),
  database: decodeURI(url.pathname.slice(1)),
  connectionLimit: 10,
});

type PrismaGlobal = typeof globalThis & {
  prisma?: PrismaClient;
};

const globalForPrisma = globalThis as PrismaGlobal;
const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;