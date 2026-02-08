"use client";

import { Input } from "@/components/ui/input";
import { useDebounce } from "use-debounce";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { SearchIcon, XIcon } from "lucide-react";

type SearchInputProps = {
  initialQuery?: string;
};

export function SearchInput({ initialQuery = "" }: SearchInputProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentQuery = searchParams.get("q") ?? "";
  const [value, setValue] = useState(initialQuery || currentQuery);
  const [debouncedValue] = useDebounce(value, 200);

  useEffect(() => {
    setValue(currentQuery);
  }, [currentQuery]);

  const nextUrl = useMemo(() => {
    const params = new URLSearchParams(searchParams.toString());
    const normalized = debouncedValue.trim();
    if (normalized) {
      params.set("q", normalized);
    } else {
      params.delete("q");
    }
    const paramString = params.toString();
    return paramString ? `${pathname}?${paramString}` : pathname;
  }, [debouncedValue, pathname, searchParams]);

  useEffect(() => {
    if (debouncedValue.trim() === currentQuery.trim()) return;
    router.replace(nextUrl, { scroll: false });
  }, [currentQuery, debouncedValue, nextUrl, router]);

  return (
    <div className={`
      z-10 fixed
      w-10/12
      mt-2 py-2 px-4
      flex flex-row items-center justify-center
      gap-x-2
      bg-zinc-950
      rounded-lg
    `}>
      <SearchIcon className="opacity-50" />

      <Input
        className="bg-none border-none font-semibold text-lg w-full p-0"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Sök program..."
      />

      {/* Hide when input is empty */}
      <button
        onClick={() => setValue("")}
        className={`size-min ${value ? "" : "hidden"}`}
      >
        <XIcon className="opacity-50" />
      </button>
    </div>
  );
}
