import { SR_Program } from "@/types/api/program";
import { Program } from "@/types/types";

export async function fetchPrograms(): Promise<Program[]> {
  const response: SR_Program[] = await fetch(
    "https://api.sr.se/api/v2/programs/index?format=json&pagination=false&isarchived=false"
  )
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
      square: program.programimage,
      wide: program.programimagetemplate,
    },
    archived: program.archived,
    hasOnDemand: program.hasondemand,
    hasPod: program.haspod,
    responsibleEditor: program.responsibleeditor,
  }));

  return programs;
}