import fs from "node:fs";
import type { JSONValue } from "../src/types";
import { isObj } from "../src/types";

// Programs:
// https://api.sr.se/api/v2/programs/index?format=json&pagination=false&isarchived=false
// https://api.sr.se/api/v2/programs/PROGRAM_ID?format=json
// https://api.sr.se/api/v2/programs/get?id=PROGRAM_ID&format=json

// Episodes:
// https://api.sr.se/api/v2/episodes/index?fromdate=YYYY-MM-DD&todate=YYYY-MM-DD&format=json&pagination=false&audioquality=high&programid=PROGRAM_ID
// https://api.sr.se/api/v2/episodes/get?id=EPISODE_ID&format=json&audioquality=high

const cacheDir = "scripts/.cache";
const channelsCacheFile = `${cacheDir}/channels.json`;
const programsCacheFile = `${cacheDir}/programs.json`;

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
};

main()
  .catch((e: unknown) => {
    console.error("Failed to run API scanner", e);
    process.exit(1);
  });

async function fetchChannels(): Promise<Record<string, unknown>[]> {
  const cachedChannels = fs.existsSync(channelsCacheFile)
    ? JSON.parse(fs.readFileSync(channelsCacheFile, "utf-8")) as Record<string, unknown>[]
    : null;

  if (cachedChannels) {
    console.info(`Using cached channels ${channelsCacheFile.length} from`, channelsCacheFile);
    return cachedChannels;
  }

  console.info("Fetching channels from API...");

  const raw_channels = await fetch("https://api.sr.se/api/v2/channels?format=json&pagination=false")
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

  if (!raw_channels) {
    console.error("Failed to fetch channels", raw_channels);
    throw new Error("Failed to fetch channels");
  }

  fs.writeFileSync(channelsCacheFile, JSON.stringify(raw_channels, null, 2));

  console.info(`Channels (${channelsCacheFile.length}) saved to ${channelsCacheFile}`);

  return raw_channels;
}

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

async function fetchPrograms(): Promise<Record<string, unknown>[]> {
  const cachedPrograms = fs.existsSync(programsCacheFile)
    ? JSON.parse(fs.readFileSync(programsCacheFile, "utf-8")) as Record<string, unknown>[]
    : null;

  if (cachedPrograms) {
    console.info(`Using cached programs (${programsCacheFile.length}) from`, programsCacheFile);
    return cachedPrograms;
  }

  console.info("Fetching programs from API...");

  const raw_programs = await fetch("https://api.sr.se/api/v2/programs/index?format=json&pagination=false&isarchived=false")
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

  if (!raw_programs) {
    console.error("Failed to fetch programs", raw_programs);
    throw new Error("Failed to fetch programs");
  }

  fs.writeFileSync(programsCacheFile, JSON.stringify(raw_programs, null, 2));

  console.info(`Programs (${programsCacheFile.length}) saved to ${programsCacheFile}`);

  return raw_programs;
}