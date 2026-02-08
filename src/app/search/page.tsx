import { getPrograms } from "@/functions/fetchers/get-programs"
import { ProgramList } from "./program-list";

export default async function SearchPage() {
  const programs = await getPrograms();

  return (
    <main className="px-0 max-h-fit overflow-y-hidden">
      <ProgramList
        initialPrograms={programs.slice(0, 10)}
        programIds={programs.map((p) => p.id)}
      />
    </main>
  );
}