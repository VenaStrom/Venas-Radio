/**
 * Ingests SR's API into the database.
 *
 * The mapping (stringified ids, liveaudio.url flattened onto the channel) is
 * carried over from the main branch, which is where this schema came from. The
 * SR-side types are the ones `yarn api:types` generates, so ingest is typed
 * against what the API actually returns rather than a hand-written guess.
 */
import type { Channel, Program } from "@/api/lib/prisma/generated";
import type { SR_Channels_Response, SR_Programs_Response } from "@/types/sr-api";
import { isSR_Channels_Response, isSR_Programs_Response } from "@/types/sr-api/type-guards";
import { prisma } from "@/api/lib/prisma";

type SR_Channel = SR_Channels_Response["channels"][number];
type SR_Program = SR_Programs_Response["programs"][number];

function mapChannel(channel: SR_Channel): Channel {
  return {
    id: channel.id.toString(),
    name: channel.name,
    channel_type: channel.channeltype,
    color: channel.color,
    // SR nests this under liveaudio. Flattening it here is what lets the client
    // never learn that object exists.
    external_audio_url: channel.liveaudio.url,
    external_site_url: channel.siteurl,
    external_schedule_url: channel.scheduleurl ?? null,
    tagline: channel.tagline,
    image_square_url: channel.image,
    image_wide_url: channel.imagetemplate,
  } satisfies Channel;
}

function mapProgram(program: SR_Program): Program {
  return {
    id: program.id.toString(),
    name: program.name,
    description: program.description,
    broadcast_info: program.broadcastinfo ?? null,
    email: program.email,
    // SR sends "" rather than omitting it, hence || over ??.
    phone: program.phone || null,
    program_slug: program.programslug ?? null,
    channel_id: program.channel.id.toString(),
    image_square_url: program.programimage,
    image_wide_url: program.programimagetemplate,
    archived: program.archived,
    has_on_demand: program.hasondemand,
    has_pod: program.haspod,
    responsible_editor: program.responsibleeditor,
  } satisfies Program;
}

async function fetchSr<T>(url: string, guard: (data: unknown) => data is T, what: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${what}: ${res.status} ${res.statusText}`);
  const data: unknown = await res.json();
  if (!guard(data)) throw new Error(`Unexpected ${what} response shape from SR`);
  return data;
}

async function main() {
  const { channels } = await fetchSr(
    "https://api.sr.se/api/v2/channels?format=json&pagination=false",
    isSR_Channels_Response,
    "channels",
  );

  const channelIds = new Set<string>();
  for (const channel of channels) {
    const row = mapChannel(channel);
    await prisma.channel.upsert({ where: { id: row.id }, create: row, update: row });
    channelIds.add(row.id);
  }
  console.info(`Upserted ${channelIds.size} channels.`);

  const { programs } = await fetchSr(
    "https://api.sr.se/api/v2/programs/index?format=json&pagination=false&isarchived=false",
    isSR_Programs_Response,
    "programs",
  );

  let orphaned = 0;
  for (const program of programs) {
    const row = mapProgram(program);
    // Some programs point at channels the channels endpoint does not list.
    // Null the FK rather than drop the program or trip the constraint.
    if (row.channel_id !== null && !channelIds.has(row.channel_id)) {
      row.channel_id = null;
      orphaned += 1;
    }
    await prisma.program.upsert({ where: { id: row.id }, create: row, update: row });
  }
  console.info(`Upserted ${programs.length} programs (${orphaned} with an unknown channel).`);
}

main()
  .catch((e: unknown) => {
    console.error("Error during seeding:", e);
    process.exitCode = 1;
  })
  .finally(() => {
    prisma.$disconnect().catch((e: unknown) => {
      console.error("Error disconnecting Prisma client:", e);
    });
  });
