"use client";

import { Input } from "@shadcn/input";
import React, { useEffect, useState } from "react";
import Fuse from "fuse.js";
import * as Icon from "lucide-react";
import { Program } from "@/types/api/program";
import ProgramDOM, { ProgramSkeleton } from "@/components/program-dom";
import { useSettingsStore } from "@/store/settings-store";

const filterKeys = [
  { name: "name", weight: 0.7 },
  { name: "description", weight: 0.3 },
];

const fetchPrograms = async () => {
  const response = await fetch("https://api.sr.se/api/v2/programs/index?format=json&pagination=false&isarchived=false");
  const data = await response.json();
  return data.programs;
};

export default function SearchPage() {
  const settingsStore = useSettingsStore();
  const [programsData, setProgramsData] = useState<Program[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortedResults, setSortedResults] = useState<Program[]>([]);
  const [renderCount, setRenderCount] = useState(6);

  // Fetch programs
  useEffect(() => {
    fetchPrograms().then(data => {
      setProgramsData(data);
      setIsLoading(false);
    });
  }, []);

  // Search
  useEffect(() => {
    const fuse = new Fuse(programsData, { keys: filterKeys });
    const results = searchTerm ? fuse.search(searchTerm).map(result => result.item) : programsData;

    const sorted = results
      .sort((a, b) => {
        if (!searchTerm) {
          const aIsFavorite = settingsStore.settings.programIDs.includes(a.id);
          const bIsFavorite = settingsStore.settings.programIDs.includes(b.id);
          if (aIsFavorite && !bIsFavorite) return -1;
          if (!aIsFavorite && bIsFavorite) return 1;
        }
        return 0;
      });
    setSortedResults(sorted);
  }, [searchTerm, programsData, settingsStore.settings.programIDs]);

  // Staggered rendering
  useEffect(() => {
    if (!isLoading && renderCount < sortedResults.length - 6) {
      const interval = setInterval(() => {
        setRenderCount(prevCount => prevCount + 1);
      }, 50);

      return () => clearInterval(interval);
    }
  }, [isLoading, renderCount, sortedResults.length]);

  return (
    <main className="flex flex-col items-center h-full gap-y-3 p-0 my-0">

      {/* Search box */}
      <div className="z-10 fixed w-10/12 max-w-xl mt-2 flex flex-row items-center justify-center bg-zinc-950 py-2 px-4 gap-x-2 rounded-lg">
        <Icon.Search className="opacity-50" />

        <Input
          className="bg-none border-none font-semibold text-lg w-full p-0"
          value={searchTerm}
          onChange={(e) => { setSearchTerm(e.target.value) }}
          placeholder="Sök program..."
        />

        {/* Hide when input is empty */}
        <button onClick={() => setSearchTerm("")} className={`size-min ${searchTerm ? "" : "hidden"}`}>
          <Icon.X className="opacity-50" />
        </button>
      </div>

      <ul className="flex-1 w-full overflow-y-scroll flex flex-col gap-y-10 pt-20 px-5 last:pb-10">
        {isLoading ? (
          <>
            {new Array(10).fill(0).map((_, i) => (
              <ProgramSkeleton key={i} />
            ))}
          </>
        ) : (
          sortedResults.slice(0, renderCount).map((program) => (
            <ProgramDOM programData={program} key={program.id} />
          ))
        )}
      </ul>
    </main>
  );
}