import { Program } from "@/prisma/client/client";
import { SR_Program } from "@/types/api/program";

export async function fetchPrograms(): Promise<Program[]> {
  const baseURL = new URL("https://api.sr.se/api/v2/programs/index");
  baseURL.searchParams.append("format", "json");
  baseURL.searchParams.append("pagination", "false");
  baseURL.searchParams.append("isarchived", "false");

  const response: SR_Program[] = await fetch(baseURL.toString())
    .then((res) => res.json())
    .then((data) => data.programs);

  const programs: Program[] = response.map((program: SR_Program) => ({
    id: program.id.toString(),
    name: program.name,
    description: program.description,
    broadcast_info: program.broadcastinfo ?? null,
    email: program.email,
    phone: program.phone || null,
    program_slug: program.programslug ?? null,
    channel_id: program.channel.id.toString(),
    image_square_url: program.programimage,
    image_wide_url: program.programimagetemplate,
    archived: program.archived,
    has_on_demand: program.hasondemand,
    has_pod: program.haspod,
    responsible_editor: program.responsibleeditor,
  } satisfies Program));

  return programs;
}