import { Program } from "@prisma/client";
import { SR_Program } from "@/types/api/program";

function mapSRProgram(program: SR_Program): Program {
  return {
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
  } satisfies Program;
}

export async function fetchPrograms(): Promise<Program[]> {
  const baseURL = new URL("https://api.sr.se/api/v2/programs/index");
  baseURL.searchParams.append("format", "json");
  baseURL.searchParams.append("pagination", "false");
  baseURL.searchParams.append("isarchived", "false");

  const response: SR_Program[] = await fetch(baseURL.toString())
    .then((res) => res.json())
    .then((data) => data.programs);

  const programs: Program[] = response.map((program: SR_Program) => mapSRProgram(program));

  return programs;
}

async function fetchProgramFromUrl(url: string): Promise<Program | null> {
  const response = await fetch(url);
  if (!response.ok) return null;
  const data = (await response.json()) as { program?: SR_Program };
  if (!data?.program) return null;
  return mapSRProgram(data.program);
}

export async function fetchProgramById(programId: string): Promise<Program | null> {
  const byIdURL = new URL(`https://api.sr.se/api/v2/programs/${programId}`);
  byIdURL.searchParams.append("format", "json");
  const direct = await fetchProgramFromUrl(byIdURL.toString());
  if (direct) return direct;

  const fallbackURL = new URL("https://api.sr.se/api/v2/programs/get");
  fallbackURL.searchParams.append("id", programId);
  fallbackURL.searchParams.append("format", "json");
  return fetchProgramFromUrl(fallbackURL.toString());
}