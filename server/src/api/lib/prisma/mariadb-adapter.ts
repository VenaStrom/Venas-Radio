import { PrismaMariaDb } from "@prisma/adapter-mariadb";

export function makeMariaDBAdapter(connectionURL: string): { adapter: PrismaMariaDb } {
  if (!connectionURL || connectionURL.trim().length === 0) throw new Error("Connection URL is required");

  const url = new URL(connectionURL);

  return {
    adapter: new PrismaMariaDb({
      host: decodeURI(url.hostname),
      port: Number(decodeURI(url.port)),
      user: decodeURI(url.username),
      password: decodeURI(url.password),
      database: decodeURI(url.pathname.slice(1)),
      // Above the default 10: the episodes refresh holds a connection per
      // in-flight upsert transaction, and a phone syncing while the feed
      // refreshes several programs starved the pool (10s pool timeout, 500s).
      connectionLimit: 25,
    }),
  };
}