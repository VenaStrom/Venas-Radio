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

if (!fs.existsSync(cacheDir)) {
  fs.mkdirSync(cacheDir);
}

const main = async () => {
  const rawChannels = await fetchChannels();
  const channelProps: Record<string, number | Record<string, number>> = {};

  for (const channel of rawChannels) {
    for (const prop in channel) {
      if (Array.isArray(channel)) {
        console.warn("Unexpected array in channel", { channel, prop });
        continue;
      }
      const val: JSONValue = channel[prop] as JSONValue;
      if (typeof val !== "object") {
        channelProps[prop] = channelProps[prop]
          ? (channelProps[prop] as number) + 1
          : 1;
      }
      else {
        channelProps[prop] ??= {};
        // eslint-disable-next-line @typescript-eslint/no-for-in-array
        for (const subProp in val) {
          if (Array.isArray(val)) {
            console.warn("Unexpected array in channel prop", { channel, prop, val, subProp });
            continue;
          }
          const subVal: JSONValue = val[subProp] as JSONValue;
          if (typeof subVal === "string") {
            (channelProps[prop] as Record<string, number>)[subProp] ??= 0;
            (channelProps[prop] as Record<string, number>)[subProp]++;
          }
        }
      }
    }
  }
  console.log({ channelProps });


  const rawPrograms = await fetchPrograms();
  const programProps: Record<string, number | Record<string, number>> = {};

  for (const program of rawPrograms) {
    for (const prop in program) {
      if (Array.isArray(program)) {
        console.warn("Unexpected array in program", { program, prop });
        continue;
      }
      const val: JSONValue = program[prop] as JSONValue;
      if (typeof val !== "object") {
        programProps[prop] = programProps[prop]
          ? (programProps[prop] as number) + 1
          : 1;
      }
      else {
        programProps[prop] ??= {};
        // eslint-disable-next-line @typescript-eslint/no-for-in-array
        for (const subProp in val) {
          if (Array.isArray(val)) {
            console.warn("Unexpected array in program prop", { program, prop, val, subProp });
            continue;
          }
          const subVal: JSONValue = val[subProp] as JSONValue;
          if (typeof subVal === "string") {
            (programProps[prop] as Record<string, number>)[subProp] ??= 0;
            (programProps[prop] as Record<string, number>)[subProp]++;
          }
        }
      }
    }
  }
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

async function fetchPrograms(): Promise<Record<string, unknown>[]> {
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

  return raw_programs;
}