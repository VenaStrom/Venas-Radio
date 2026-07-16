import type { ApiError, ChannelDto, ChannelsResponse, ProgramDto, ProgramsResponse } from "@/types/api";
import { authRouter } from "@/api/routes/auth";
import { episodesRouter } from "@/api/routes/episodes";
import { discordConfigured } from "@/api/lib/auth";
import { prisma } from "@/api/lib/prisma";
import express from "express";

const app = express();
app.use(express.json());
app.use(authRouter);
app.use(episodesRouter);

type Paging = { skip: number; take: number };

/**
 * Shared because both list endpoints validated `page`/`pagesize` identically,
 * and drifted anyway: only /api/channels returned allIds.
 */
function parsePaging(page: unknown, pageSize: unknown): Paging | null {
  if (typeof page !== "string" || typeof pageSize !== "string") return null;

  const pageNum = Number(page);
  const sizeNum = Number(pageSize);
  if (!Number.isInteger(pageNum) || pageNum < 1) return null;
  if (!Number.isInteger(sizeNum) || sizeNum < 1) return null;

  return { skip: (pageNum - 1) * sizeNum, take: sizeNum };
}

const invalidPaging: ApiError = { error: "Missing or invalid 'page' or 'pagesize' query parameters." };

app.get("/api/channels", async (req, res) => {
  const paging = parsePaging(req.query.page, req.query.pagesize);
  if (!paging) {
    res.status(400).json(invalidPaging);
    return;
  }

  const [total, allIds, rows] = await Promise.all([
    prisma.channel.count(),
    prisma.channel.findMany({ select: { id: true }, orderBy: { id: "asc" } }),
    prisma.channel.findMany({
      skip: paging.skip,
      take: paging.take,
      orderBy: { id: "asc" },
    }),
  ]);

  const channels: ChannelDto[] = rows.map(row => ({
    id: row.id,
    name: row.name,
    tagline: row.tagline,
    image: row.image_square_url,
    color: row.color,
    // Already flattened at ingest, so no join is needed here.
    streamUrl: row.external_audio_url,
  }));

  const body: ChannelsResponse = {
    channels,
    total,
    allIds: allIds.map(c => c.id),
  };
  res.json(body);
});

app.get("/api/programs", async (req, res) => {
  const paging = parsePaging(req.query.page, req.query.pagesize);
  if (!paging) {
    res.status(400).json(invalidPaging);
    return;
  }

  const [total, allIds, rows] = await Promise.all([
    prisma.program.count(),
    prisma.program.findMany({ select: { id: true }, orderBy: { id: "asc" } }),
    prisma.program.findMany({
      skip: paging.skip,
      take: paging.take,
      orderBy: { id: "asc" },
    }),
  ]);

  const programs: ProgramDto[] = rows.map(row => ({
    id: row.id,
    name: row.name,
    description: row.description,
    image: row.image_square_url,
    channelId: row.channel_id,
    hasPod: row.has_pod,
  }));

  const body: ProgramsResponse = {
    programs,
    total,
    allIds: allIds.map(p => p.id),
  };
  res.json(body);
});

app.listen(3000, () => {
  console.log("Server is running on http://localhost:3000");
  if (!discordConfigured) {
    console.warn("DISCORD_CLIENT_ID / DISCORD_CLIENT_SECRET are unset — /auth/discord/* will return 503.");
  }
});
