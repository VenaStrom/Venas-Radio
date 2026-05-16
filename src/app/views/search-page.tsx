import type { Program } from "@/api/lib/prisma/generated";
import { ProgramCard } from "@/app/components/cards/program";
import { isObj, isProgram } from "@/types";
import { useEffect, useState } from "react";

export function SearchPage(): React.ReactNode {
  const pageSize = 20;
  const [page, setPage] = useState<number>(1);

  const [allIds, setAllIds] = useState<number[] | null>(null);
  const [programs, setPrograms] = useState<Record<number, Program>>(() => LoadProgramsFromLocalStorage() ?? {});
  const [totalPrograms, setTotalPrograms] = useState<number | null>(null);

  // Get programs on mount
  useEffect(() => {
    async function fetchPrograms() {
      const res = await fetch(`/api/programs?page=${page}&pagesize=${pageSize}`);
      const data = await res.json() as {
        programs: Program[];
        progress: number;
        total: number;
        allIds: number[];
      };

      if (!data.programs.every(isProgram)) {
        throw new Error("Invalid program data received from server.");
      }

      setTotalPrograms(data.total);
      setAllIds(data.allIds);
      setPrograms(prev => {
        const newLookup = { ...prev };
        for (const program of data.programs) newLookup[program.id] = program;
        SaveProgramsToLocalStorage(newLookup);
        return newLookup;
      });
    }

    fetchPrograms()
      .catch((err: unknown) => {
        console.error({ err });
      });
  }, [page]);

  // On scroll handler
  useEffect(() => {
    const programList = document.getElementById("program-ul") as HTMLUListElement | null;
    if (!programList) return;

    const margin = 300; // Trigger loading a bit before reaching the end

    function onScroll() {
      const firstUnloaded = programList?.querySelector("li[id^='to-be-loaded-']");
      if (firstUnloaded) {
        if (firstUnloaded) {
          const rect = firstUnloaded.getBoundingClientRect();
          if (rect.top < window.innerHeight + margin) {
            // Remove id to mark as loaded (and prevent multiple triggers)
            firstUnloaded.removeAttribute("id");

            setPage(prev => prev + 1);
          }
        }
      }
    }

    programList.addEventListener("scroll", onScroll);
    return () => programList.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <main>
      <section className="h-(--live-section-height) overflow-y-auto" id="program-ul">
        <span className="ps-4 text-center italic text-xs text-zinc-500">{totalPrograms ?? "--"} program</span>

        <ul className="px-6 flex flex-col gap-y-4 last:pb-20">
          {allIds
            ? allIds.map((id) => (
              programs[id]
                ? <ProgramCard key={id} program={programs[id]} />
                : <ProgramCard.Skeleton key={id} id={`to-be-loaded-${id}`} />
            ))
            : new Array(pageSize).fill(0).map((_, i) =>
              <ProgramCard.Skeleton key={"program-skeleton-" + i} />,
            )
          }
        </ul>
      </section>
    </main>
  );
}

function SaveProgramsToLocalStorage(programs: Record<number, Program>) {
  try {
    localStorage.setItem("programs-lookup", JSON.stringify({ programs, timestamp: Date.now() }));
    console.log("Saved programs to localStorage:", Object.keys(programs).length);
  }
  catch (err: unknown) {
    console.error("Failed to save programs to localStorage:", err);
  }
}

function LoadProgramsFromLocalStorage(): Record<number, Program> | null {
  try {
    const data = localStorage.getItem("programs-lookup");
    if (!data) return null;

    const parsed = JSON.parse(data) as unknown;
    if (!isObj(parsed)) return null;

    // Type checking
    if (!("programs" in parsed) || !isObj(parsed.programs)) {
      console.warn("Invalid program data in localStorage: missing or invalid 'programs' property, ignoring.");
      return null;
    }
    if (!Object.values(parsed.programs).every(isProgram)) {
      console.warn("Invalid program data in localStorage, ignoring.");
      return null;
    }

    console.info(`Loaded ${Object.keys(parsed.programs).length} programs from localStorage.`);
    return parsed as Record<number, Program>;
  }
  catch (err: unknown) {
    console.error("Failed to load programs from localStorage:", err);
    return null;
  }
}