import { proxy } from "@/lib/proxy-rewrite";
import { SR_Program } from "@/types/api/program";
import { Program } from "@/types/types";

export async function fetchPrograms(): Promise<Program[]> {
  const baseURL = new URL("https://api.sr.se/api/v2/programs/index");
  baseURL.searchParams.append("format", "json");
  baseURL.searchParams.append("pagination", "false");
  baseURL.searchParams.append("isarchived", "false");

  const response: SR_Program[] = await fetch(proxy(baseURL.toString()))
    .then((res) => res.json())
    .then((data) => data.programs);

  const programs: Program[] = response.map((program: SR_Program) => ({
    id: program.id,
    name: program.name,
    description: program.description,
    broadcastInfo: program.broadcastinfo,
    email: program.email,
    phone: program.phone,
    programSlug: program.programslug,
    channelId: program.channel.id,
    channelName: program.channel.name,
    image: {
      square: proxy(program.programimage),
      wide: proxy(program.programimagetemplate),
    },
    archived: program.archived,
    hasOnDemand: program.hasondemand,
    hasPod: program.haspod,
    responsibleEditor: program.responsibleeditor,
  }));

  return programs;
}