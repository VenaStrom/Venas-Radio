import fs from "node:fs";
import path from "node:path";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";

const DEFAULT_CACHE_TTL_MS = 1000 * 60 * 60 * 48; // 48 hours
const DEFAULT_CACHE_DIR = path.join(process.cwd(), ".audio-cache");
const EPISODE_DIR = "episodes";
const TMP_STALE_MS = 1000 * 60 * 60; // .tmp older than this is a dead partial download

const inFlightDownloads = new Map<string, Promise<void>>();

function getCacheDir() {
  return process.env.AUDIO_CACHE_DIR || DEFAULT_CACHE_DIR;
}

function sanitizeId(rawId: string) {
  return rawId.replace(/[^a-zA-Z0-9-_]/g, "_");
}

export function getEpisodeCachePath(episodeId: string) {
  const filename = `${sanitizeId(episodeId)}.audio`;
  return path.join(getCacheDir(), EPISODE_DIR, filename);
}

async function ensureDir(filePath: string) {
  await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
}

async function isFresh(filePath: string, ttlMs: number) {
  try {
    const stat = await fs.promises.stat(filePath);
    return Date.now() - stat.mtimeMs < ttlMs;
  }
  catch {
    return false;
  }
}

async function downloadToFile(url: string, filePath: string) {
  const response = await fetch(url);
  if (!response.ok || !response.body) {
    throw new Error(`Failed to fetch audio (${response.status})`);
  }

  const tempPath = `${filePath}.tmp`;
  await ensureDir(filePath);

  // @ts-expect-error types be crazy TODO: reconsider life
  const nodeStream = Readable.fromWeb(response.body);
  const outStream = fs.createWriteStream(tempPath);

  try {
    await pipeline(nodeStream, outStream);
    await fs.promises.rename(tempPath, filePath);
  }
  catch (error) {
    await fs.promises.unlink(tempPath).catch(() => undefined);
    throw error;
  }
}

export async function ensureEpisodeCached(
  episodeId: string,
  sourceUrl: string,
  ttlMs = DEFAULT_CACHE_TTL_MS,
) {
  const filePath = getEpisodeCachePath(episodeId);

  if (await isFresh(filePath, ttlMs)) {
    return filePath;
  }

  const existing = inFlightDownloads.get(episodeId);
  if (existing) {
    await existing;
    return filePath;
  }

  const downloadPromise = downloadToFile(sourceUrl, filePath);
  inFlightDownloads.set(episodeId, downloadPromise);

  try {
    await downloadPromise;
  }
  finally {
    inFlightDownloads.delete(episodeId);
  }

  return filePath;
}

export function getCacheTtlMs() {
  const raw = process.env.AUDIO_CACHE_TTL_HOURS;
  const hours = raw ? Number(raw) : NaN;
  if (Number.isFinite(hours) && hours > 0) {
    return hours * 60 * 60 * 1000;
  }
  return DEFAULT_CACHE_TTL_MS;
}

function getMaxCacheBytes() {
  const raw = process.env.AUDIO_CACHE_MAX_MB;
  const mb = raw ? Number(raw) : NaN;
  if (Number.isFinite(mb) && mb > 0) {
    return mb * 1024 * 1024;
  }
  return null;
}

export async function cleanupAudioCache(ttlMs = getCacheTtlMs()) {
  const episodeDir = path.join(getCacheDir(), EPISODE_DIR);

  let names: string[];
  try {
    names = await fs.promises.readdir(episodeDir);
  }
  catch {
    return { removed: 0, remainingBytes: 0 };
  }

  const now = Date.now();
  let removed = 0;
  const kept: { filePath: string; mtimeMs: number; size: number }[] = [];

  for (const name of names) {
    const filePath = path.join(episodeDir, name);

    let stat: fs.Stats;
    try {
      stat = await fs.promises.stat(filePath);
    }
    catch {
      continue;
    }
    if (!stat.isFile()) continue;

    const age = now - stat.mtimeMs;
    const expired = name.endsWith(".tmp")
      ? age > TMP_STALE_MS
      : age >= ttlMs;

    if (expired) {
      await fs.promises.unlink(filePath).catch(() => undefined);
      removed += 1;
      continue;
    }

    kept.push({ filePath, mtimeMs: stat.mtimeMs, size: stat.size });
  }

  let remainingBytes = kept.reduce((sum, file) => sum + file.size, 0);

  const maxBytes = getMaxCacheBytes();
  if (maxBytes !== null && remainingBytes > maxBytes) {
    kept.sort((a, b) => a.mtimeMs - b.mtimeMs);
    for (const file of kept) {
      if (remainingBytes <= maxBytes) break;
      await fs.promises.unlink(file.filePath).catch(() => undefined);
      remainingBytes -= file.size;
      removed += 1;
    }
  }

  return { removed, remainingBytes };
}
