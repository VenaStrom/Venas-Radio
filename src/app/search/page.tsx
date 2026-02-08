import { getPrograms } from "@/functions/fetchers/get-programs";
import { ProgramList } from "@/app/search/program-list";
import { SearchInput } from "@/app/search/search-input";
import { Suspense } from "react";

type SearchPageProps = {
  searchParams?: Promise<{
    q?: string;
  }>;
};

export default function SearchPage({ searchParams }: SearchPageProps) {
  return (
    <Suspense>
      <SearchPageContent searchParams={searchParams} />
    </Suspense>
  );
}

async function SearchPageContent({ searchParams }: SearchPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const searchQuery = typeof resolvedSearchParams?.q === "string" ? resolvedSearchParams.q : "";
  const programs = await getPrograms({ search: searchQuery });

  return (
    <main className="flex-1 p-0 overflow-y-hidden">
      <div className="h-0 w-full flex justify-center">
        <SearchInput initialQuery={searchQuery} />
      </div>
      <ProgramList
        initialPrograms={programs.slice(0, 30)}
        batchSize={30}
        programIds={programs.map((p) => p.id)}
      />
    </main>
  );
}