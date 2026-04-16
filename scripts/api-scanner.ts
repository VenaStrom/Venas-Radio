import fs from "node:fs";
import type { JSONValue } from "../src/types";
import { isObj } from "../src/types";

// Episodes:
// https://api.sr.se/api/v2/episodes/index?fromdate=YYYY-MM-DD&todate=YYYY-MM-DD&format=json&pagination=false&audioquality=high&programid=PROGRAM_ID
// https://api.sr.se/api/v2/episodes/get?id=EPISODE_ID&format=json&audioquality=high

const cacheDir = "scripts/.cache";
const channelsCacheFile = `${cacheDir}/channels.json`;
const programsCacheFile = `${cacheDir}/programs.json`;
const programsSingleCacheFile = `${cacheDir}/programs-single.json`;

if (!fs.existsSync(cacheDir)) {
  fs.mkdirSync(cacheDir);
}

const main = async () => {
  const rawChannels = await fetchChannels();
  const channelProps = parseProps(rawChannels);
  console.log({ channelProps });

  const rawPrograms = await fetchPrograms();
  const programProps = parseProps(rawPrograms);
  console.log({ programProps });

  const rawSinglePrograms = await fetchSinglePrograms(rawPrograms);
  const programSingleProps = parseProps(rawSinglePrograms);
  console.log({ programSingleProps });
};

main()
  .catch((e: unknown) => {
    console.error("Failed to run API scanner", e);
    process.exit(1);
  });

type ParsedPropStats = {
  primitive: number;
  object: number;
  array: number;
  objectStringProps: Record<string, number>;
};

type ParsedProps = Record<string, ParsedPropStats>;

function parseProps(items: Record<string, unknown>[]): ParsedProps {
  const parsedProps: ParsedProps = {};

  for (const item of items) {
    for (const prop in item) {
      const val: JSONValue = item[prop] as JSONValue;
      const propStats = parsedProps[prop] ?? {
        primitive: 0,
        object: 0,
        array: 0,
        objectStringProps: {},
      };

      if (Array.isArray(val)) {
        propStats.array++;
      }
      else if (!isObj(val)) {
        propStats.primitive++;
      }
      else {
        propStats.object++;
        for (const subProp in val) {
          const subVal: JSONValue = val[subProp] as JSONValue;
          if (typeof subVal === "string") {
            propStats.objectStringProps[subProp] ??= 0;
            propStats.objectStringProps[subProp]++;
          }
        }
      }

      parsedProps[prop] = propStats;
    }
  }

  return parsedProps;
}

async function fetchChannels(): Promise<Record<string, unknown>[]> {
  const cachedChannels = fs.existsSync(channelsCacheFile)
    ? JSON.parse(fs.readFileSync(channelsCacheFile, "utf-8")) as Record<string, unknown>[]
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
      if (
        !data
        || !isObj(data)
        || !("channels" in data)
        || !Array.isArray(data.channels)
        || !data.channels.every((channel: unknown) => isObj(channel))
      ) {
        console.error("Invalid channels response", data);
        return null;
      }

      return data.channels;
    });

  if (!rawChannels) {
    console.error("Failed to fetch channels", rawChannels);
    throw new Error("Failed to fetch channels");
  }

  fs.writeFileSync(channelsCacheFile, JSON.stringify(rawChannels, null, 2));

  console.info(`Channels (${rawChannels.length}) saved to ${channelsCacheFile}`);

  return rawChannels;
}

async function fetchPrograms(): Promise<Record<string, unknown>[]> {
  const cachedPrograms = fs.existsSync(programsCacheFile)
    ? JSON.parse(fs.readFileSync(programsCacheFile, "utf-8")) as Record<string, unknown>[]
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
      if (
        !data
        || !isObj(data)
        || !("programs" in data)
        || !Array.isArray(data.programs)
        || !data.programs.every((program: unknown) => isObj(program))
      ) {
        console.error("Invalid programs response", data);
        return null;
      }

      return data.programs;
    });

  if (!rawPrograms) {
    console.error("Failed to fetch programs", rawPrograms);
    throw new Error("Failed to fetch programs");
  }

  fs.writeFileSync(programsCacheFile, JSON.stringify(rawPrograms, null, 2));

  console.info(`Programs (${rawPrograms.length}) saved to ${programsCacheFile}`);

  return rawPrograms;
}

async function fetchSinglePrograms(programs: Record<string, unknown>[]): Promise<Record<string, unknown>[]> {
  const cachedPrograms = fs.existsSync(programsSingleCacheFile)
    ? JSON.parse(fs.readFileSync(programsSingleCacheFile, "utf-8")) as Record<string, unknown>[]
    : null;

  if (cachedPrograms) {
    console.info(`Using cached single programs (${programsSingleCacheFile.length}) from`, programsSingleCacheFile);
    return cachedPrograms;
  }

  const programIds = programs
    .map(program => program.id)
    .filter((id): id is number => typeof id === "number");

  console.info(`Fetching single program payloads for ${programIds.length} programs...`);

  const singlePrograms = await Promise.all(
    programIds.map(async (id) => {
      let data: unknown;

      try {
        const response = await fetch(`https://api.sr.se/api/v2/programs/get?id=${id}&format=json`);
        data = await response.json() as unknown;
      }
      catch (e: unknown) {
        console.error("Failed to fetch single program", { id, e });
        return null;
      }

      if (!data || !isObj(data) || !("program" in data) || !isObj(data.program)) {
        console.error("Invalid single program response", { id, data });
        return null;
      }

      return data.program;
    }),
  );

  const validSinglePrograms = singlePrograms.filter((program): program is Record<string, unknown> => !!program);

  fs.writeFileSync(programsSingleCacheFile, JSON.stringify(validSinglePrograms, null, 2));

  console.info(`Single programs (${validSinglePrograms.length}) saved to ${programsSingleCacheFile}`);

  return validSinglePrograms;
}