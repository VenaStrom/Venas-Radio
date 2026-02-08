"use client";

import ProgramDOM from "@/components/program-dom";
import { getProgramsByIds } from "@/functions/fetchers/get-programs";
import { Program } from "@/prisma/client/client";
import { useEffect, useState } from "react";

export function ProgramList({
  initialPrograms,
  programIds,
}: {
  initialPrograms?: Program[];
  programIds: string[];
}) {
  const [programMap, setProgramMap] = useState<Record<string, Program>>(Object.fromEntries((initialPrograms || []).map((p) => [p.id, p])));
  const fetchableIds = programIds.filter((id) => !programMap[id]);

  const batchSize = 10;
  const idBatches = fetchableIds.reduce<string[][]>((batches, id, index) => {
    if (index % batchSize === 0) batches.push([]);
    batches[batches.length - 1].push(id);
    return batches;
  }, []);
  const [activatedBatches, setActivatedBatches] = useState<Set<number>>(new Set());

  const fetchPrograms = async (ids: string[]) => {
    const newPrograms = await getProgramsByIds(ids);
    if (!newPrograms) {
      console.warn("No programs found for IDs:", ids);
      return;
    }
    setProgramMap((prev) => {
      const updatedMap = { ...prev };
      newPrograms.forEach((program) => {
        updatedMap[program.id] = program;
      });
      return updatedMap;
    });
  };

  // Load on scroll
  const handleScroll = (e: React.UIEvent<HTMLUListElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    const perProgramHeight = scrollHeight / programIds.length;
    const loadedProgramsCount = activatedBatches.size * batchSize;

    const pixelProgress = scrollTop + clientHeight;
    const loadedPixels = loadedProgramsCount * perProgramHeight;

    const threshold = perProgramHeight * 10;

    if (pixelProgress > loadedPixels - threshold) {
      const nextBatchIndex = idBatches.findIndex((batch) =>
        !activatedBatches.has(idBatches.indexOf(batch))
        && batch.some((id) => !programMap[id])
      );
      const nextBatch = nextBatchIndex !== -1 ? idBatches[nextBatchIndex] : null;
      if (nextBatch) {
        setActivatedBatches((prev) => new Set(prev).add(nextBatchIndex));
      }
    }
  };

  // On activated batch change, fetch programs
  useEffect(() => {
    const batchesToFetch = Array.from(activatedBatches)
      .map((index) => idBatches[index])
      .filter(batch => batch.some(id => !programMap[id]));
    batchesToFetch.forEach((batch) => fetchPrograms(batch));
  }, [activatedBatches, idBatches, programMap]);


  return (
    <ul
      className={`
        flex-1 w-full
        overflow-y-auto
        h-full
        flex flex-col
        gap-y-10
        pt-20 px-6 last:pb-10
      `}
      onScroll={handleScroll}
    >
      {programIds.map((id) => {
        const program = programMap[id];
        return program ? <ProgramDOM key={id} program={program} /> : <ProgramDOM.Skeleton key={id} />;
      })}
    </ul>
  );
}