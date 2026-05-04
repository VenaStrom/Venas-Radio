import { isArr, isObj, isSet } from "@/types";
import fs from "node:fs";

const cacheDir = "scripts/.cache";
const channelsCacheFile = `${cacheDir}/channels.json`;
const programsCacheFile = `${cacheDir}/programs.json`;
const resultDir = "scripts/.cache/results";
const channelsResultFile = `${resultDir}/channels.json`;
const programsResultFile = `${resultDir}/programs.json`;
const episodesResultFile = `${resultDir}/episodes.json`;
const defaultEpisodeSampleSize = 25;
const defaultEpisodeSeed = 20260416;
const defaultEpisodeDaysBack = 30;

const typeGenOutputDir = "src/types/sr-api";
const typeGenChannelsFile = `${typeGenOutputDir}/channels.d.ts`;
const typeGenProgramsFile = `${typeGenOutputDir}/programs.d.ts`;
const typeGenEpisodesFile = `${typeGenOutputDir}/episodes.d.ts`;

if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);
if (!fs.existsSync(resultDir)) fs.mkdirSync(resultDir);
if (!fs.existsSync(typeGenOutputDir)) fs.mkdirSync(typeGenOutputDir);

const main = async () => {
  const testDataObj = {
    stringProp: "string",
    numberProp: 123,
    booleanProp: true,
    undefinedProp: undefined,
    arrayOfStrings: ["a", "b", "c"],
    arrayOfNumbers: [1, 2, 3],
    arrayOfBooleans: [true, false],
    arrayOfObjects: [
      { nestedString: "nested", nestedNumber: 456 },
      { nestedString: "nested2", nestedNumber: 789 },
      { nestedString: "nested2", nestedNumber: 789, optional: true },
    ],
  };
  const testDataArray = [
    JSON.parse(JSON.stringify(testDataObj)),
    JSON.parse(JSON.stringify((() => { delete testDataObj.arrayOfStrings; return testDataObj; })())),
  ];

  const testTypeTree = parseTypeOfTree(testDataObj);
  const testTypeTree2 = parseTypeOfTree(testDataArray);
  generateTSFiles(testTypeTree, `${typeGenOutputDir}/test-object.d.ts`, "TestObject");
  generateTSFiles(testTypeTree2, `${typeGenOutputDir}/test-array.d.ts`, "TestArray");

  const rawChannels = await fetchChannels();
  const channelProps = parseTypeOfTree(rawChannels as TypeTree);
  fs.writeFileSync(channelsResultFile, JSON.stringify(channelProps, null, 2));
  generateTSFiles(channelProps, typeGenChannelsFile, "SR_Channels_Response");
  console.info("Channels done");

  const rawPrograms = await fetchPrograms();
  const programProps = parseTypeOfTree(rawPrograms as TypeTree);
  fs.writeFileSync(programsResultFile, JSON.stringify(programProps, null, 2));
  generateTSFiles(programProps, typeGenProgramsFile, "SR_Programs_Response");
  console.info("Programs done");

  const programIDs = (rawPrograms.programs as { id: number }[]).map(p => p.id);

  const rawEpisodes = await fetchEpisodesForSampledPrograms(programIDs);
  const episodeProps = parseTypeOfTree(rawEpisodes as TypeTree);
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

type Leaf = Set<string>; // All possible primitive types at a leaf node
type TypeTree = Leaf | TypeTree[] | { [key: string]: TypeTree };

function parseTypeOfTree(value: Record<string, unknown> | Record<string, unknown>[]): TypeTree {

  const expanded = expandTree(value as TypeTree);

  return expanded;

  function expandTree(tree: TypeTree): TypeTree {
    const typeofTree = typeof tree;
    if (typeofTree === "string" || typeofTree === "number" || typeofTree === "boolean") {
      return new Set([typeofTree]);
    }
    else if (typeofTree === "undefined") {
      return new Set(["undefined"]);
    }
    else if (isSet(tree)) {
      return tree;
    }
    else if (isArr(tree)) {
      return parseArray(tree);
    }
    else if (isObj(tree)) {
      return parseObject(tree);
    }
    console.warn("Unexpected value type during type tree parsing", { tree, typeofTree });
    return new Set(["unknown"]);
  }

  function parseArray(arr: TypeTree[]): TypeTree {
    if (arr.length === 0) return new Set(["unknown"]);

    const itemTrees = arr.map(item => expandTree(item));
    const uniqueItemTrees = new Set<string>();
    const resultTrees: TypeTree[] = [];

    itemTrees.forEach(tree => {
      const treeStr = JSON.stringify(tree);
      if (!uniqueItemTrees.has(treeStr)) {
        uniqueItemTrees.add(treeStr);
        resultTrees.push(tree);
      }
    });

    const arrOfObjs = arr.filter(isObj).map(v => parseObject(v as Record<string, unknown>));
    const allKeys = new Set<string>();
    const keyCounts: Record<string, number> = {};
    arrOfObjs.forEach(obj => Object.keys(obj).forEach(key => {
      allKeys.add(key);
      keyCounts[key] ??= 0;
      keyCounts[key] += 1;
    }));

    const totalObjects = arrOfObjs.length;
    const optionalKeys = [...allKeys].filter(key => typeof keyCounts[key] === "number" ? keyCounts[key] < totalObjects : false);

    // Delete optional keys and replace with `key?`
    resultTrees.forEach(tree => {
      if (isObj(tree)) {
        optionalKeys.forEach(optKey => {
          if (optKey in tree) {
            const val = tree[optKey];
            if (!val) throw new Error("Unexpected falsy value for optional key in type tree");
            delete tree[optKey];
            tree[`${optKey}?`] = val;
          }
        });
      }
    });

    if (resultTrees.length === 1) {
      const first = resultTrees[0];
      if (!first) throw new Error("Unexpected empty array after parsing type tree");
      return [first];
    }
    else {
      return resultTrees;
    }
  }
  function parseObject(obj: Record<string, unknown>): TypeTree {
    const result: Record<string, TypeTree> = {};
    Object.entries(obj).forEach(([key, val]) => {
      const hasOptionalMarker = key.endsWith("?");
      const rawKey = hasOptionalMarker ? key.slice(0, -1) : key;
      const expandedVal = expandTree(val as TypeTree);
      if (hasOptionalMarker) {
        // Mark optional properties by including `undefined` in the set of possible types
        if (isSet(expandedVal)) {
          expandedVal.add("undefined");
          result[rawKey] = expandedVal;
        }
        else {
          result[rawKey] = new Set(["undefined", "unknown"]);
        }
      }
      else {
        result[rawKey] = expandedVal;
      }
    });
    return result;
  }
}

function generateTSFiles(typeTree: TypeTree, outputFile: string, typeName: string) {
  const content = `\nexport type ${typeName} = ${generateTSType(typeTree)};\n`;
  fs.writeFileSync(outputFile, content);

  function generateTSType(tree: TypeTree, depth: number = 1): string {
    if (typeof tree !== "object") throw new Error("Unexpected string in type tree");

    // Set of types
    if (isSet(tree)) {
      return Array.from(tree).join(" | ");
    }
    // Array
    else if (isArr(tree)) {
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
        const hasOptionalMarker = key.endsWith("?");
        const rawKey = hasOptionalMarker ? key.slice(0, -1) : key;
        let gen = generateTSType(val, depth + 1);

        // Mark optional properties when `undefined` appears in the union
        let optional = hasOptionalMarker;
        if (gen.includes("undefined")) {
          optional = true;
          gen = gen.split(" | ").join(" | ") || "unknown";
        }

        // Quote keys that are not valid TS identifiers
        const isValidIdent = /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(rawKey);
        const printedKey = isValidIdent ? rawKey : `"${rawKey.replace(/"/g, '\\"')}"`;

        result += `${"  ".repeat(depth)}${printedKey}${optional ? "?" : ""}: ${gen};\n`;
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