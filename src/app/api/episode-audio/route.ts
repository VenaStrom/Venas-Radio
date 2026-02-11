import fs from "node:fs";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { ensureEpisodeCached, getCacheTtlMs, getEpisodeCachePath } from "@/lib/audio-cache";
import { fetchEpisodeById } from "@/functions/external-fetchers/episode-fetcher";
import { fetchProgramById } from "@/functions/external-fetchers/program-fetcher";

const DEFAULT_CONTENT_TYPE = "audio/mpeg";

async function ensureEpisodeAudioSource(episodeId: string) {
  const existing = await prisma.episode.findUnique({
    where: { id: episodeId },
    select: { id: true, external_audio_url: true, program_id: true },
  });

  if (existing?.external_audio_url) {
    return existing;
  }

  const fetchedEpisode = await fetchEpisodeById(episodeId);
  if (!fetchedEpisode?.external_audio_url) {
    return null;
  }

  const programId = fetchedEpisode.program_id;
  const existingProgram = await prisma.program.findUnique({
    where: { id: programId },
    select: { id: true },
  });

  if (!existingProgram) {
    const fetchedProgram = await fetchProgramById(programId);
    if (!fetchedProgram) {
      return null;
    }

    let channelId = fetchedProgram.channel_id ?? null;
    if (channelId) {
      const channelExists = await prisma.channel.findUnique({
        where: { id: channelId },
        select: { id: true },
      });
      if (!channelExists) {
        channelId = null;
      }
    }

    await prisma.program.create({
      data: {
        ...fetchedProgram,
        channel_id: channelId,
      },
    });
  }

  return prisma.episode.upsert({
    where: { id: fetchedEpisode.id },
    update: {
      title: fetchedEpisode.title,
      description: fetchedEpisode.description,
      external_audio_url: fetchedEpisode.external_audio_url,
      publish_date: fetchedEpisode.publish_date,
      duration: fetchedEpisode.duration,
      image_square_url: fetchedEpisode.image_square_url,
      image_wide_url: fetchedEpisode.image_wide_url,
      program_id: fetchedEpisode.program_id,
    },
    create: fetchedEpisode,
    select: { id: true, external_audio_url: true },
  });
}

function buildRangeResponse(filePath: string, size: number, rangeHeader: string) {
  const match = /bytes=(\d+)-(\d+)?/.exec(rangeHeader);
  if (!match) {
    return null;
  }

  const start = Number(match[1]);
  const end = match[2] ? Number(match[2]) : size - 1;

  if (!Number.isFinite(start) || !Number.isFinite(end) || start > end || end >= size) {
    return null;
  }

  const stream = fs.createReadStream(filePath, { start, end });

  return new NextResponse(stream as unknown as BodyInit, {
    status: 206,
    headers: {
      "Content-Range": `bytes ${start}-${end}/${size}`,
      "Accept-Ranges": "bytes",
      "Content-Length": `${end - start + 1}`,
      "Content-Type": DEFAULT_CONTENT_TYPE,
      "Cache-Control": "private, max-age=0, must-revalidate",
    },
  });
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const episodeId = searchParams.get("episode_id");

  if (!episodeId) {
    return NextResponse.json({ error: "Missing episode_id" }, { status: 400 });
  }

  const episode = await ensureEpisodeAudioSource(episodeId);
  if (!episode?.external_audio_url) {
    return NextResponse.json({ error: "Episode not found" }, { status: 404 });
  }

  const ttlMs = getCacheTtlMs();
  const filePath = getEpisodeCachePath(episodeId);

  try {
    await ensureEpisodeCached(episodeId, episode.external_audio_url, ttlMs);
  }
  catch (error) {
    try {
      await fs.promises.access(filePath);
    }
    catch {
      console.error("Failed to cache episode audio", episodeId, error);
      return NextResponse.json({ error: "Failed to fetch audio" }, { status: 502 });
    }
  }

  const stat = await fs.promises.stat(filePath);
  const range = request.headers.get("range");

  if (range) {
    const ranged = buildRangeResponse(filePath, stat.size, range);
    if (ranged) return ranged;
  }

  const stream = fs.createReadStream(filePath);
  return new NextResponse(stream as unknown as BodyInit, {
    status: 200,
    headers: {
      "Content-Length": `${stat.size}`,
      "Content-Type": DEFAULT_CONTENT_TYPE,
      "Accept-Ranges": "bytes",
      "Cache-Control": "private, max-age=0, must-revalidate",
    },
  });
}
