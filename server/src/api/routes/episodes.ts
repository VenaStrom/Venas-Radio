import type { ApiError, EpisodeDto, EpisodesResponse } from "@/types/api";
import type { SR_Episodes_Response } from "@/types/sr-api";
import { isSR_Episodes_Response } from "@/types/sr-api/type-guards";
import { prisma } from "@/api/lib/prisma";
import express from "express";

export const episodesRouter = express.Router();

type SR_Episode = SR_Episodes_Response["episodes"][number];

/** Same window main's episode-prefetch used: two weeks back, a week of early publications ahead. */
const windowPastDays = 14;
const windowFutureDays = 7;

/** How long a program's episode list is trusted before SR is asked again. */
const refreshTtlMs = 15 * 60 * 1000;

/** Matches the web client's likedProgramsCookieLimit; one SR request per program. */
const maxProgramsPerRequest = 50;

/** program id -> epoch ms of the last successful SR refresh. In-memory on purpose: a restart just refetches. */
const lastRefreshedAt = new Map<string, number>();

/** Pod file first (persistent), else the broadcast recording — same priority as main's episode-fetcher. */
function episodeAudio(episode: SR_Episode): { url: string; duration: number } | null {
  const audio = episode.listenpodfile
    ?? episode.downloadpodfile
    ?? episode.broadcast?.playlist
    ?? episode.broadcast?.broadcastfiles?.[0];
  return audio ? { url: audio.url, duration: audio.duration } : null;
}

/** SR serializes dates as "/Date(1700000000000)/". */
function parseSRDate(value: string): Date {
  return new Date(parseInt(value.replace(/\D/g, ""), 10));
}

async function fetchProgramEpisodesFromSR(programId: string): Promise<SR_Episode[]> {
  const url = new URL("https://api.sr.se/api/v2/episodes/index");
  url.searchParams.set("programid", programId);
  url.searchParams.set("fromdate", new Date(Date.now() - windowPastDays * 86_400_000).toISOString().slice(0, 10));
  url.searchParams.set("todate", new Date(Date.now() + windowFutureDays * 86_400_000).toISOString().slice(0, 10));
  url.searchParams.set("format", "json");
  url.searchParams.set("pagination", "false");
  url.searchParams.set("audioquality", "high");

  const response = await fetch(url);
  if (!response.ok) throw new Error(`SR episodes/index for program ${programId}: HTTP ${response.status}`);

  const data: unknown = await response.json();
  if (!isSR_Episodes_Response(data)) throw new Error(`SR episodes/index for program ${programId}: unexpected shape`);
  return data.episodes;
}

/**
 * Pulls fresh episodes from SR for every requested program whose data has gone
 * stale, and upserts them. Failures are logged, not thrown: the DB rows we
 * already have are a better answer than a 500 because SR hiccuped.
 */
async function refreshStalePrograms(programIds: string[]): Promise<void> {
  const now = Date.now();
  const stale = programIds.filter(id => (lastRefreshedAt.get(id) ?? 0) <= now - refreshTtlMs);
  if (stale.length === 0) return;

  const requested = new Set(stale);
  const results = await Promise.allSettled(
    stale.map(async (programId) => ({ programId, episodes: await fetchProgramEpisodesFromSR(programId) })),
  );

  const upserts = [];
  for (const result of results) {
    if (result.status === "rejected") {
      console.warn("Episode refresh failed:", result.reason);
      continue;
    }
    lastRefreshedAt.set(result.value.programId, now);

    for (const episode of result.value.episodes) {
      const audio = episodeAudio(episode);
      // No playable audio (upcoming broadcast, expired pod) -> nothing to offer.
      if (!audio) continue;
      // Guards the program FK: SR can label an episode with a program we never asked for.
      const programId = episode.program.id.toString();
      if (!requested.has(programId)) continue;

      const row = {
        title: episode.title,
        description: episode.description,
        external_audio_url: audio.url,
        duration: audio.duration,
        publish_date: parseSRDate(episode.publishdateutc),
        image_square_url: episode.imageurl,
        image_wide_url: episode.imageurltemplate,
        program_id: programId,
      };
      upserts.push(prisma.episode.upsert({
        where: { id: episode.id.toString() },
        update: row,
        create: { id: episode.id.toString(), ...row },
      }));
    }
  }

  if (upserts.length > 0) await prisma.$transaction(upserts);
}

episodesRouter.get("/api/episodes", async (req, res) => {
  const raw = req.query.programIds;
  const programIds = typeof raw === "string"
    ? Array.from(new Set(raw.split(",").map(id => id.trim()).filter(Boolean)))
    : [];

  if (programIds.length === 0 || programIds.length > maxProgramsPerRequest) {
    const error: ApiError = { error: `'programIds' must be a comma-separated list of 1..${maxProgramsPerRequest} ids.` };
    res.status(400).json(error);
    return;
  }

  await refreshStalePrograms(programIds);

  const rows = await prisma.episode.findMany({
    where: { program_id: { in: programIds } },
    include: { program: { select: { name: true } } },
    orderBy: { publish_date: "desc" },
    take: 200,
  });

  const episodes: EpisodeDto[] = rows.map(row => ({
    id: row.id,
    title: row.title,
    description: row.description,
    image: row.image_wide_url,
    programId: row.program_id,
    programName: row.program.name,
    audioUrl: row.external_audio_url,
    durationSeconds: Math.round(row.duration),
    publishedAtMs: row.publish_date.getTime(),
  }));

  res.json({ episodes } satisfies EpisodesResponse);
});
