import fs from "node:fs";
import path from "node:path";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";

const DEFAULT_CACHE_TTL_MS = 1000 * 60 * 60 * 48; // 48 hours
const DEFAULT_CACHE_DIR = path.join(process.cwd(), ".audio-cache");
const EPISODE_DIR = "episodes";

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
