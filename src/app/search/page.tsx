// import { Input } from "@/components/ui/input";
// import { useMemo, useState } from "react";
// import Fuse from "fuse.js";
// import { SearchIcon, XIcon } from "lucide-react";
// import ProgramDOM, { ProgramSkeleton } from "@/components/program-dom";
// import { usePlayContext } from "@/components/play-context/play-context-use";
// import { Program } from "@/types/types";
// import { useDebounce } from "use-debounce";

// const filterKeys: { name: keyof Program; weight: number; }[] = [
//   { name: "name", weight: 0.7 },
//   { name: "description", weight: 0.3 },
// ];

export default async function SearchPage() {
  // const { programDB, followedPrograms, isFetchingPrograms } = usePlayContext();

  // const programs = useMemo(() => {
  //   return Object.values(programDB)
  //     .sort((a, b) => {
  //       const aFollowed = followedPrograms.includes(a.id) ? 0 : 1;
  //       const bFollowed = followedPrograms.includes(b.id) ? 0 : 1;

  //       if (aFollowed !== bFollowed) {
  //         return aFollowed - bFollowed; // Followed programs first
  //       }
  //       return a.name.localeCompare(b.name); // Then sort by name
  //     });
  // }, [programDB, followedPrograms]);

  // // Search
  // const [searchTerm, setSearchTerm] = useState("");
  // const debouncedSearchTerm = useDebounce(searchTerm, 200)[0];
  // const searchResult = useMemo(() => {
  //   const fuse = new Fuse(programs, { keys: filterKeys });
  //   return debouncedSearchTerm.trim()
  //     ? fuse.search(debouncedSearchTerm).map((result) => result.item)
  //     : programs
  //       .sort((a, b) => {
  //         const aFollowed = followedPrograms.includes(a.id) ? 0 : 1;
  //         const bFollowed = followedPrograms.includes(b.id) ? 0 : 1;

  //         if (aFollowed !== bFollowed) {
  //           return aFollowed - bFollowed; // Followed programs first
  //         }
  //         return a.name.localeCompare(b.name); // Then sort by name
  //       });
  // }, [programs, debouncedSearchTerm, followedPrograms]);

  return (
    <main>

    </main>
  )
  // return (
  //   <main className="flex flex-col items-center h-full gap-y-3 p-0 my-0">
  //     {/* Search box */}
  //     <div className="z-10 fixed w-10/12 max-w-xl mt-2 flex flex-row items-center justify-center bg-zinc-950 py-2 px-4 gap-x-2 rounded-lg">
  //       <SearchIcon className="opacity-50" />

  //       <Input
  //         className="bg-none border-none font-semibold text-lg w-full p-0"
  //         value={searchTerm}
  //         onChange={(e) => {
  //           setSearchTerm(e.target.value);
  //         }}
  //         placeholder="Sök program..."
  //       />

  //       {/* Hide when input is empty */}
  //       <button
  //         onClick={() => setSearchTerm("")}
  //         className={`size-min ${searchTerm ? "" : "hidden"}`}
  //       >
  //         <XIcon className="opacity-50" />
  //       </button>
  //     </div>

  //     <ul className="flex-1 w-full overflow-y-scroll flex flex-col gap-y-10 pt-20 px-5 last:pb-10">
  //       {isFetchingPrograms ? (
  //         <>
  //           {new Array(10).fill(0).map((_, i) => (
  //             <ProgramSkeleton key={i} />
  //           ))}
  //         </>
  //       ) : (
  //         searchResult
  //           .map((program) => (
  //             <ProgramDOM programData={program} key={program.id} />
  //           ))
  //       )}
  //     </ul>
  //   </main>
  // );
}