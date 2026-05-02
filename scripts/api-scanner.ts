import { isObj } from "@/types";
import fs from "node:fs";

const cacheDir = "scripts/.cache";
const channelsCacheFile = `${cacheDir}/channels.json`;
const programsCacheFile = `${cacheDir}/programs.json`;
const programsSingleCacheFile = `${cacheDir}/programs-single.json`;
const resultDir = "scripts/.cache/results";
const channelsResultFile = `${resultDir}/channels.json`;
const programsResultFile = `${resultDir}/programs.json`;
const programsSingleResultFile = `${resultDir}/programs-single.json`;
const episodesResultFile = `${resultDir}/episodes.json`;
const defaultEpisodeSampleSize = 25;
const defaultEpisodeSeed = 20260416;
const defaultEpisodeDaysBack = 30;

const typeGenOutputDir = "src/types/sr-api";
const typeGenChannelsFile = `${typeGenOutputDir}/channels.d.ts`;
const typeGenProgramsFile = `${typeGenOutputDir}/programs.d.ts`;
const typeGenProgramsSingleFile = `${typeGenOutputDir}/programs-single.d.ts`;
const typeGenEpisodesFile = `${typeGenOutputDir}/episodes.d.ts`;

if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);
if (!fs.existsSync(resultDir)) fs.mkdirSync(resultDir);
if (!fs.existsSync(typeGenOutputDir)) fs.mkdirSync(typeGenOutputDir);

const main = async () => {
  const rawChannels = await fetchChannels();
  const channelProps = parseObjType(rawChannels);
  fs.writeFileSync(channelsResultFile, JSON.stringify(channelProps, null, 2));
  generateTSFiles(channelProps, typeGenChannelsFile, "SR_Channels_Response");
  console.info("Channels done");

  const rawPrograms = await fetchPrograms();
  const programProps = parseObjType(rawPrograms);
  fs.writeFileSync(programsResultFile, JSON.stringify(programProps, null, 2));
  generateTSFiles(programProps, typeGenProgramsFile, "SR_Programs_Response");
  console.info("Programs done");

  const programIDs = (rawPrograms.programs as { id: number }[]).map(p => p.id);

  const rawSinglePrograms = await fetchSinglePrograms(programIDs);
  const programSingleProps = parseObjType(rawSinglePrograms);
  fs.writeFileSync(programsSingleResultFile, JSON.stringify(programSingleProps, null, 2));
  generateTSFiles(programSingleProps, typeGenProgramsSingleFile, "SR_ProgramSingles_Responses");
  console.info("Program singles done");

  const rawEpisodes = await fetchEpisodesForSampledPrograms(programIDs);
  const episodeProps = parseObjType(rawEpisodes);
  fs.writeFileSync(episodesResultFile, JSON.stringify(episodeProps, null, 2));
  generateTSFiles(episodeProps, typeGenEpisodesFile, "SR_Episodes_Response");
  console.info("Episodes done");

  // Make index file in types/api that exports all generated types
  const indexContent = `export type * from "./channels";\nexport type * from "./programs";\nexport type * from "./programs-single";\nexport type * from "./episodes";`;
  fs.writeFileSync(`${typeGenOutputDir}/index.d.ts`, indexContent);
};

main()
  .catch((e: unknown) => {
    console.error("Failed to run API scanner", e);
    process.exit(1);
  });

type Typeof = "string" | "number" | "boolean" | "undefined";
type TypeTree = Set<Typeof> | Typeof[] | Typeof | { [key: string]: TypeTree } | TypeTree[];

function parseObjType(inTree: Record<string, unknown> | Record<string, unknown>[]): TypeTree {
  const tree: TypeTree = {};

  // Early array handling
  if (Array.isArray(inTree)) {
    return inTree.map(item => isObj(item) ? parseObjType(item) : typeof item as Typeof);
  }

  // Recurse to type every key
  for (const key in inTree) {
    const value = inTree[key];

    // Objects
    if (isObj(value)) {
      tree[key] = parseObjType(value);
    }

    // Arrays
    else if (Array.isArray(value)) {
      (tree[key] as TypeTree[]) = value.map(parseObjType);
    }

    // Primitives
    else {
      tree[key] ??= new Set<Typeof>();
      (tree[key] as Set<Typeof>).add(typeof value as Typeof);
    }
  }

  // Set<Typeof> -> Typeof[]
  for (const key in tree) {
    if (tree[key] instanceof Set) {
      tree[key] = tree[key].size === 1
        ? tree[key].values().next().value ?? "undefined"
        : Array.from(tree[key]);
    }
  }

  // Collapse identical arrays
  for (const key in tree) {
    if (Array.isArray(tree[key])) {
      const array = tree[key] as TypeTree[];
      if (array.length > 0 && array.every(item => JSON.stringify(item) === JSON.stringify(array[0]))) {
        tree[key] = [array[0] ?? "undefined"];
      }
    }
  }
  if (Array.isArray(tree)) {
    const array = tree as TypeTree[];
    if (array.length > 0 && array.every(item => JSON.stringify(item) === JSON.stringify(array[0]))) {
      return [array[0] ?? "undefined"];
    }
  }

  return tree;
}

function generateTSFiles(typeTree: TypeTree, outputFile: string, typeName: string) {
  const content = `\nexport type ${typeName} = ${generateTSType(typeTree)};\n`;
  fs.writeFileSync(outputFile, content);

  function generateTSType(tree: TypeTree, depth: number = 1): string {
    if (typeof tree === "string") {
      return tree;
    }
    else if (Array.isArray(tree)) {
      if (tree.length === 0) return "unknown[]";
      const itemType = generateTSType(tree[0] ?? "undefined", depth);
      return `${itemType}[]`;
    }
    else if (tree instanceof Set) {
      return Array.from(tree).join(" | ");
    }
    else if (typeof tree === "object") {
      const entryIndent = "  ".repeat(depth);
      const closingIndent = "  ".repeat(Math.max(0, depth - 1));
      const entries = Object.entries(tree).map(([key, subtree]) => {
        const optional = subtree === "undefined" || (Array.isArray(subtree) && subtree.includes("undefined")) ? "?" : "";
        const type = generateTSType(subtree, depth + 1);
        return `${entryIndent}${key}${optional}: ${type};`;
      });
      return `{\n${entries.join("\n")}\n${closingIndent}}`;
    }
    else {
      return "unknown";
    }
  }
}

async function fetchChannels(): Promise<Record<string, unknown>> {
  const cachedChannels = fs.existsSync(channelsCacheFile)
    ? JSON.parse(fs.readFileSync(channelsCacheFile, "utf-8")) as Record<string, unknown>
    : null;

  if (cachedChannels) {
    console.info(`Using cached channels ${channelsCacheFile.length} from`, channelsCacheFile);
    return cachedChannels;
  }

  console.info("Fetching channels from API...");

  const rawChannels = await fetch("https://api.sr.se/api/v2/channels?format=json&pagination=false")
    .catch((e: unknown) => {
      console.error("Failed to fetch channels", e);
      return null;
    })
    .then(res => res?.json())
    .then((data: unknown) => {
      if (!data || !isObj(data)) {
        console.error("Invalid channels response", data);
        return null;
      }
      return data;
    });

  if (!rawChannels) {
    console.error("Failed to fetch channels", rawChannels);
    throw new Error("Failed to fetch channels");
  }

  fs.writeFileSync(channelsCacheFile, JSON.stringify(rawChannels, null, 2));

  console.info(`Channels (${(rawChannels.channels as unknown[]).length}) saved to ${channelsCacheFile}`);

  return rawChannels;
}

async function fetchPrograms(): Promise<Record<string, unknown>> {
  const cachedPrograms = fs.existsSync(programsCacheFile)
    ? JSON.parse(fs.readFileSync(programsCacheFile, "utf-8")) as Record<string, unknown>
    : null;

  if (cachedPrograms) {
    console.info(`Using cached programs (${programsCacheFile.length}) from`, programsCacheFile);
    return cachedPrograms;
  }

  console.info("Fetching programs from API...");

  const rawPrograms = await fetch("https://api.sr.se/api/v2/programs/index?format=json&pagination=false&isarchived=false")
    .catch((e: unknown) => {
      console.error("Failed to fetch programs", e);
      return null;
    })
    .then(res => res?.json())
    .then((data: unknown) => {
      if (!data || !isObj(data)) {
        console.error("Invalid programs response", data);
        return null;
      }
      return data;
    });

  if (!rawPrograms) {
    console.error("Failed to fetch programs", rawPrograms);
    throw new Error("Failed to fetch programs");
  }

  fs.writeFileSync(programsCacheFile, JSON.stringify(rawPrograms, null, 2));

  console.info(`Programs (${(rawPrograms as { programs: unknown[] })["programs"].length}) saved to ${programsCacheFile}`);

  return rawPrograms;
}

async function fetchSinglePrograms(programIDs: number[]): Promise<Record<string, unknown>[]> {
  const cachedPrograms = fs.existsSync(programsSingleCacheFile)
    ? JSON.parse(fs.readFileSync(programsSingleCacheFile, "utf-8")) as Record<string, unknown>[]
    : null;

  if (cachedPrograms) {
    console.info(`Using cached single programs (${programsSingleCacheFile.length}) from`, programsSingleCacheFile);
    return cachedPrograms;
  }

  console.info(`Fetching single program payloads for ${programIDs.length} programs...`);

  const singlePrograms = await Promise.all(
    programIDs.map(async (id) => {
      let data: unknown;

      try {
        const response = await fetch(`https://api.sr.se/api/v2/programs/get?id=${id}&format=json`);
        data = await response.json() as unknown;
      }
      catch (err: unknown) {
        console.error("Failed to fetch single program", { id, err });
        return null;
      }

      if (!data || !isObj(data)) {
        console.error("Invalid single program response", { id, data });
        return null;
      }

      return data;
    }),
  );

  const validSinglePrograms = singlePrograms.filter((program): program is Record<string, unknown> => !!program);

  fs.writeFileSync(programsSingleCacheFile, JSON.stringify(validSinglePrograms, null, 2));

  console.info(`Single programs (${validSinglePrograms.length}) saved to ${programsSingleCacheFile}`);

  return validSinglePrograms;
}

async function fetchEpisodesForSampledPrograms(programIDs: number[]): Promise<Record<string, unknown>[]> {
  const seed = Number(process.env.API_SCANNER_EPISODE_SEED ?? defaultEpisodeSeed);
  const sampleSize = Number(process.env.API_SCANNER_EPISODE_SAMPLE_SIZE ?? defaultEpisodeSampleSize);
  const daysBack = Number(process.env.API_SCANNER_EPISODE_DAYS_BACK ?? defaultEpisodeDaysBack);

  const toDate = new Date();
  const fromDate = new Date(toDate);
  fromDate.setDate(fromDate.getDate() - daysBack);

  const toDateStr = formatDateYYYYMMDD(toDate);
  const fromDateStr = formatDateYYYYMMDD(fromDate);
  const episodesCacheFile = `${cacheDir}/episodes-seed-${seed}-sample-${sampleSize}-from-${fromDateStr}-to-${toDateStr}.json`;

  const cachedEpisodes = fs.existsSync(episodesCacheFile)
    ? JSON.parse(fs.readFileSync(episodesCacheFile, "utf-8")) as Record<string, unknown>[]
    : null;

  if (cachedEpisodes) {
    console.info(`Using cached episodes (${cachedEpisodes.length}) from`, episodesCacheFile);
    return cachedEpisodes;
  }

  const sampledProgramIds = sampleWithoutReplacement(programIDs, sampleSize, seed);

  console.info(`Fetching one-month episode payloads for ${sampledProgramIds.length} sampled programs...`, {
    seed,
    sampleSize,
    fromDate: fromDateStr,
    toDate: toDateStr,
  });

  const episodesByProgram: (Record<string, unknown> | null)[] = await Promise.all(
    sampledProgramIds.map(async (programId) => {
      let data: unknown;

      try {
        const response = await fetch(`https://api.sr.se/api/v2/episodes/index?fromdate=${fromDateStr}&todate=${toDateStr}&format=json&pagination=false&audioquality=high&programid=${programId}`);
        data = await response.json() as unknown;
      }
      catch (err: unknown) {
        console.error("Failed to fetch episodes for program", { programId, err });
        return null;
      }

      if (!isObj(data)) {
        console.error("Invalid episodes response structure", { programId, data });
        return null;
      }

      return data;
    }),
  );

  const episodes: Record<string, unknown>[] = [];
  for (const episodesForProgram of episodesByProgram) {
    if (!episodesForProgram) continue;
    episodes.push(episodesForProgram);
  }

  fs.writeFileSync(episodesCacheFile, JSON.stringify(episodes, null, 2));

  console.info(`Episodes (${episodes.length}) saved to ${episodesCacheFile}`);

  return episodes;
}

function formatDateYYYYMMDD(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function sampleWithoutReplacement(values: number[], requestedCount: number, seed: number): number[] {
  const rng = seededRng(seed);
  const sampled = [...values];

  for (let i = sampled.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [sampled[i], sampled[j]] = [sampled[j] as number, sampled[i] as number];
  }

  return sampled.slice(0, Math.max(0, Math.min(requestedCount, sampled.length)));
}

function seededRng(seed: number): () => number {
  let state = seed >>> 0;

  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}