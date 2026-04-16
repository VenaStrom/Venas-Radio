import fs from "node:fs";
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
  if (raw_channels) fs.writeFileSync(channelsCacheFile, JSON.stringify(raw_channels, null, 2));
  console.info(`Channels (${channelsCacheFile.length}) saved to ${channelsCacheFile}`);


};

main()
  .catch((e: unknown) => {
    console.error("Failed to run API scanner", e);
    process.exit(1);
  });