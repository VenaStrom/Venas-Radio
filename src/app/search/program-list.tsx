"use client";

import ProgramDOM from "@/components/program-dom";
import { getProgramsByIds } from "@/functions/fetchers/get-programs";
import { Program } from "@prisma/client";
import { useEffect, useMemo, useState } from "react";
import { usePlayContext } from "@/components/play-context/play-context-use";

function orderProgramsByFavorites(programIds: string[], favoriteIds: Set<string>): string[] {
  if (favoriteIds.size === 0) return programIds;

  const favorites: string[] = [];
  const others: string[] = [];
  for (const id of programIds) {
    if (favoriteIds.has(id)) {
      favorites.push(id);
    } else {
      others.push(id);
    }
  }

  return favorites.concat(others);
}

export function ProgramList({
  initialPrograms,
  batchSize = 30,
  programIds,
}: {
  initialPrograms?: Program[];
  batchSize?: number;
  programIds: string[];
}) {
  const { followedPrograms } = usePlayContext();
  const [programMap, setProgramMap] = useState<Record<string, Program>>(Object.fromEntries((initialPrograms || []).map((p) => [p.id, p])));
  const orderedProgramIds = useMemo(() => {
    return orderProgramsByFavorites(programIds, new Set(followedPrograms));
  }, [programIds, followedPrograms]);
  const idBatches = useMemo(() => {
    return orderedProgramIds.reduce<string[][]>((batches, id, index) => {
      if (index % batchSize === 0) batches.push([]);
      batches[batches.length - 1].push(id);
      return batches;
    }, []);
  }, [orderedProgramIds, batchSize]);
  const [activatedBatches, setActivatedBatches] = useState<Set<number>>(new Set());

  const mergedProgramMap = useMemo(() => {
    const updatedMap = { ...programMap };
    (initialPrograms || []).forEach((program) => {
      updatedMap[program.id] = program;
    });
    return updatedMap;
  }, [programMap, initialPrograms]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setActivatedBatches(new Set());
  }, [orderedProgramIds]);

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
    const perProgramHeight = scrollHeight / orderedProgramIds.length;
    const loadedProgramsCount = Array.from(activatedBatches).reduce((sum, index) => {
      const batch = idBatches[index];
      return batch ? sum + batch.length : sum;
    }, 0);

    const pixelProgress = scrollTop + clientHeight;
    const loadedPixels = loadedProgramsCount * perProgramHeight;

    const threshold = perProgramHeight * batchSize;

    if (pixelProgress > loadedPixels - threshold) {
      const nextBatchIndex = idBatches.findIndex((batch, index) => (
        !activatedBatches.has(index)
        && batch.some((id) => !mergedProgramMap[id])
      ));
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
      .filter((batch): batch is string[] => Boolean(batch))
      .filter((batch) => batch.some((id) => !mergedProgramMap[id]));
    batchesToFetch.forEach((batch) => fetchPrograms(batch));
  }, [activatedBatches, idBatches, mergedProgramMap, programMap]);

  return (
    <ul
      className={`
        flex-1 min-h-0 w-full
        overflow-y-auto
        flex flex-col
        gap-y-12
        pt-4 px-6 last:pb-10
      `}
      onScroll={handleScroll}
    >
      {orderedProgramIds.map((id) => {
        const program = mergedProgramMap[id];
        return program ? <ProgramDOM key={id} program={program} /> : <ProgramDOM.Skeleton key={id} />;
        return <ProgramDOM.Skeleton key={id} />;
      })}
    </ul>
  );
}