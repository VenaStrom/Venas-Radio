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
  if (Array.isArray(episodeProps) && typeof episodeProps[0] === "object")
    generateTSFiles(episodeProps[0], typeGenEpisodesFile, "SR_Episodes_Response");
  else
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
type TypeTree = Set<Typeof> | { [key: string]: TypeTree } | TypeTree[];

function parseObjType(inputTree: Record<string, unknown> | Record<string, unknown>[]): TypeTree {
  const tree: TypeTree = {};

  // Early array handling
  if (Array.isArray(inputTree)) {
    return inputTree.map(item => isObj(item)
      ? parseObjType(item) // Branch
      : new Set([typeof item as Typeof]), // Leaf
    );
  }

  // Recurse to type every key
  for (const key in inputTree) {
    const value = inputTree[key];

    // Objects
    if (isObj(value)) {
      tree[key] = parseObjType(value);
    }

    // Arrays
    else if (Array.isArray(value)) {
      // Primitive array
      if (value.every(item => !isObj(item))) {
        tree[key] = new Set(value.map(item => typeof item as Typeof));
      }
      else if (value.every(item => isObj(item))) {
        const parsedArray = value.map(parseObjType);

        // Count props and types
        const propsCount: Record<string, number> = {};
        const propsTypes: Record<string, Set<Typeof>> = {};
        for (const item of parsedArray) {
          if (!isObj(item)) continue;
          for (const prop in item) {
            const val = item[prop];
            if (!val) continue;
            if (!(val instanceof Set)) continue;

            propsCount[prop] ??= 0;
            propsCount[prop]++;

            propsTypes[prop] ??= new Set<Typeof>();
            for (const t of val) {
              propsTypes[prop].add(t);
            }
          }
        }

        const diffProps = Object.keys(propsCount).filter(prop => propsCount[prop] !== value.length);

        // Put "undefined" on missing props
        for (const prop in propsTypes) {
          if (diffProps.includes(prop)) {
            const val = propsTypes[prop];
            if (!val) continue;
            propsTypes[prop] = new Set([...val, "undefined"]);
          }
        }

        const collapsedArray: { [key: string]: TypeTree } = {};
        for (const prop in propsTypes) {
          const val = propsTypes[prop];
          if (!val) continue;
          collapsedArray[prop] = val;
        }

        tree[key] = [collapsedArray];
      }
      else {
        console.warn("Mixed array types detected at key", key, "with value", value);
        tree[key] = value.map(item => isObj(item)
          ? parseObjType(item) // Branch
          : new Set([typeof item as Typeof]), // Leaf
        );
      }
    }

    // Primitives
    else {
      tree[key] ??= new Set<Typeof>();
      (tree[key] as Set<Typeof>).add(typeof value as Typeof);
    }
  }

  // Type guarding
  if (
    Array.isArray(tree)
    || tree instanceof Set
    || typeof tree === "string"
  ) {
    throw new Error("Unexpected tree structure after parsing");
  }

  return tree;
}

function generateTSFiles(typeTree: TypeTree, outputFile: string, typeName: string) {
  const content = `\nexport type ${typeName} = ${generateTSType(typeTree)};\n`;
  fs.writeFileSync(outputFile, content);

  function generateTSType(tree: TypeTree, depth: number = 1): string {
    if (typeof tree !== "object") throw new Error("Unexpected string in type tree");

    // Set of types
    if (tree instanceof Set) {
      return Array.from(tree).join(" | ");
    }
    // Array
    else if (Array.isArray(tree)) {
      if (tree.length === 0) return "unknown[]";

      const onlyItem = tree[0];
      if (!onlyItem) throw new Error("Unexpected empty array in type tree");

      const itemType = generateTSType(onlyItem, depth);
      return `${itemType}[]`;
    }
    // Else recurse
    else if (isObj(tree)) {
      let result = "{\n";
      Object.entries(tree).forEach(([key, val]) => {
        result += `${"  ".repeat(depth)}${key}: ${generateTSType(val, depth + 1)};\n`;
      });
      return result + `${"  ".repeat(depth - 1)}}`;
    }
    else {
      console.warn("Unexpected tree node type during TS generation", { tree, depth });
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