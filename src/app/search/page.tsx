import ProgramDOM from "@/components/program-dom";
import { getPrograms } from "@/functions/fetchers/get-programs"

export default async function SearchPage() {
  const programs = await getPrograms();

  return (
    <main>
      <ul className="flex-1 w-full overflow-y-scroll flex flex-col gap-y-10 pt-20 px-5 last:pb-10">
        {programs.map((program) => (
          <ProgramDOM programData={program} key={program.id} />
        ))}
      </ul>
    </main>
  );
}