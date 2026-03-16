import fs from "node:fs";
import { NextRequest, NextResponse } from "next/server";
import { ensureEpisodeCached, getCacheTtlMs, getEpisodeCachePath } from "@/lib/audio-cache";
import { ensureEpisodeAudioSource } from "@/lib/ensure-episode-source";

const CONTENT_TYPE = "audio/mpeg";

type EpisodeSegment = {
  filePath: string;
  startByte: number;
  byteLength: number;
};

async function buildSegments(episodeIds: string[]): Promise<EpisodeSegment[] | null> {
  const ttlMs = getCacheTtlMs();
  const segments: EpisodeSegment[] = [];
  let cumulativeBytes = 0;

  for (const id of episodeIds) {
    const source = await ensureEpisodeAudioSource(id);
    if (!source?.external_audio_url) return null;

    const filePath = getEpisodeCachePath(id);

    try {
      await ensureEpisodeCached(id, source.external_audio_url, ttlMs);
    }
    catch {
      // Use stale file if present
      try {
        await fs.promises.access(filePath);
      }
      catch {
        return null;
      }
    }

    const stat = await fs.promises.stat(filePath);
    segments.push({ filePath, startByte: cumulativeBytes, byteLength: stat.size });
    cumulativeBytes += stat.size;
  }

  return segments;
}

function streamSegments(
  segments: EpisodeSegment[],
  rangeStart: number,
  rangeEnd: number,
): ReadableStream<Uint8Array> {
  return new ReadableStream<Uint8Array>({
    async start(controller) {
      for (const seg of segments) {
        const segEnd = seg.startByte + seg.byteLength - 1;

        // Skip segments entirely before range
        if (segEnd < rangeStart) continue;
        // Stop after range is satisfied
        if (seg.startByte > rangeEnd) break;

        const fileStart = Math.max(0, rangeStart - seg.startByte);
        const fileEnd = Math.min(seg.byteLength - 1, rangeEnd - seg.startByte);

        await new Promise<void>((resolve, reject) => {
          const fileStream = fs.createReadStream(seg.filePath, { start: fileStart, end: fileEnd });
          fileStream.on("data", (chunk) => controller.enqueue(chunk as Uint8Array));
          fileStream.on("end", resolve);
          fileStream.on("error", reject);
        });
      }
      controller.close();
    },
  });
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const episodeIdsParam = searchParams.get("episode_ids");

  if (!episodeIdsParam) {
    return NextResponse.json({ error: "Missing episode_ids" }, { status: 400 });
  }

  const episodeIds = episodeIdsParam.split(",").map((id) => id.trim()).filter(Boolean);
  if (episodeIds.length === 0) {
    return NextResponse.json({ error: "No episode IDs provided" }, { status: 400 });
  }

  const segments = await buildSegments(episodeIds);
  if (!segments || segments.length === 0) {
    return NextResponse.json({ error: "Failed to prepare episodes" }, { status: 502 });
  }

  const totalBytes = segments.reduce((sum, s) => sum + s.byteLength, 0);
  const rangeHeader = request.headers.get("range");

  if (rangeHeader) {
    const match = /bytes=(\d+)-(\d*)/.exec(rangeHeader);
    if (!match) {
      return new NextResponse(null, {
        status: 416,
        headers: { "Content-Range": `bytes */${totalBytes}` },
      });
    }

    const start = parseInt(match[1], 10);
    const end = match[2] ? parseInt(match[2], 10) : totalBytes - 1;

    if (start > end || end >= totalBytes) {
      return new NextResponse(null, {
        status: 416,
        headers: { "Content-Range": `bytes */${totalBytes}` },
      });
    }

    const stream = streamSegments(segments, start, end);
    return new NextResponse(stream as unknown as BodyInit, {
      status: 206,
      headers: {
        "Content-Type": CONTENT_TYPE,
        "Content-Range": `bytes ${start}-${end}/${totalBytes}`,
        "Content-Length": `${end - start + 1}`,
        "Accept-Ranges": "bytes",
        "Cache-Control": "no-store",
      },
    });
  }

  const stream = streamSegments(segments, 0, totalBytes - 1);
  return new NextResponse(stream as unknown as BodyInit, {
    status: 200,
    headers: {
      "Content-Type": CONTENT_TYPE,
      "Content-Length": `${totalBytes}`,
      "Accept-Ranges": "bytes",
      "Cache-Control": "no-store",
    },
  });
}
