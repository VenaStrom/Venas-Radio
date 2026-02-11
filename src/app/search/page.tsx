import { getPrograms } from "@/functions/fetchers/get-programs";
import { ProgramList } from "@/app/search/program-list";
import SearchInput from "@/app/search/search-input";
import { Suspense } from "react";
import ProgramDOM from "@/components/program-dom";
import { auth } from "@clerk/nextjs/server";
import { cookies } from "next/headers";

const likedProgramsCookieKey = "likedPrograms";
const likedProgramsCookieLimit = 50;

async function readLikedProgramsFromCookie(): Promise<string[]> {
  const store = await cookies();
  const raw = store.get(likedProgramsCookieKey)?.value;
  if (!raw) return [];
  try {
    const parsed = JSON.parse(decodeURIComponent(raw)) as string[] | number[];
    return parsed.map((id) => id.toString()).filter(Boolean).slice(0, likedProgramsCookieLimit);
  } catch {
    return [];
  }
}

type SearchPageProps = {
  searchParams?: Promise<{
    q?: string;
  }>;
};

export default function SearchPage({ searchParams }: SearchPageProps) {
  return (
    <Suspense fallback={<ProgramListSkeleton />}>
      <SearchPageContent searchParams={searchParams} />
    </Suspense>
  );
}

async function SearchPageContent({ searchParams }: SearchPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const searchQuery = typeof resolvedSearchParams?.q === "string" ? resolvedSearchParams.q : "";
  const { userId } = await auth();
  const preferredIds = await readLikedProgramsFromCookie();
  const programs = await getPrograms({ search: searchQuery, userId, preferredIds });

  return (
    <main className="p-0 overflow-y-hidden flex flex-col">
      <div className="h-0 w-full flex justify-center">
        <SearchInput
          initialQuery={searchQuery}
          placeholder="Sök program..."
        />
      </div>
      <ProgramList
        initialPrograms={programs.slice(0, 30)}
        batchSize={30}
        programIds={programs.map((p) => p.id)}
      />
    </main>
  );
}

function ProgramListSkeleton() {
  return (
    <ul
      className={`
        flex-1 min-h-0 w-full
        overflow-y-auto
        flex flex-col
        gap-y-10
        pt-4 px-6 last:pb-10
      `}
    >
      {new Array(10).fill(0).map((_, i) => (
        <ProgramDOM.Skeleton key={i} />
      ))}
    </ul>
  );
}