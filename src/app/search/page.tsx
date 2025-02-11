"use client";

import { Input } from "@/components/ui/input";
import React, { useEffect, useState } from "react";
import Fuse from "fuse.js";
import * as Icon from "lucide-react";
import { Program } from "@/types/program";
import ProgramDOM from "@/components/program-dom";

const filterKeys = ["name", "description"];

export default function SearchPage() {
    // Fetch programs
    const [programsData, setProgramData] = useState<Program[]>([]);
    useEffect(() => {
        fetch("https://api.sr.se/api/v2/programs/index?format=json&pagination=false&isarchived=false")
            .then(response => response.json())
            .then(data => {
                setProgramData(data.programs);
            });
    }, []);

    // Search stuff
    const [searchTerm, setSearchTerm] = useState("");
    const fuse = new Fuse(programsData, { keys: filterKeys });
    const results = searchTerm ? fuse.search(searchTerm).map(result => result.item) : programsData;

    return (
        <main className="flex flex-col items-center h-full gap-y-3 py-0 my-0">

            {/* Search box */}
            <div className="fixed w-10/12 mt-2 flex flex-row items-center justify-center bg-zinc-950 py-2 px-4 gap-x-2 rounded-lg">
                <Icon.Search className="opacity-50" />

                <Input
                    className="bg-none border-none font-semibold text-lg w-full p-0"
                    value={searchTerm}
                    onChange={(e) => {setSearchTerm(e.target.value)}}
                    placeholder="Sök program..."
                />

                {/* Hide when input is empty */}
                <button onClick={() => setSearchTerm("")} className={`size-min ${searchTerm ? "" : "hidden"}`}>
                    <Icon.X className="opacity-50" />
                </button>
            </div>

            <ul className="flex-1 w-full overflow-y-scroll flex flex-col gap-y-10 pt-20">
                {results.map((program) => (
                    <ProgramDOM programData={program} key={program.id} />
                ))}
            </ul>
        </main>
    );
}