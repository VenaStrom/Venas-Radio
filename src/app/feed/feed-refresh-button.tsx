"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { isObj, type JSONValue } from "@/types";

export default function FeedRefreshButton({ programIds }: { programIds: string[] }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    if (isLoading || programIds.length === 0) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/episode-prefetch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ programIds }),
      });

      if (!response.ok) {
        const payload = await response.json() as JSONValue;

        if (
          !!payload
          && isObj(payload)
          && "error" in payload
          && typeof payload.error === "string"
        ) {
          throw new Error(payload.error);
        }
        throw new Error("Kunde inte hamta avsnitt.");
      }

      router.refresh();
    }
    catch (caught) {
      console.warn("Error fetching episodes:", caught);
      setError(caught instanceof Error ? caught.message : "Kunde inte hamta avsnitt.");
    }
    finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <Button onClick={() => handleClick} disabled={isLoading || programIds.length === 0}>
        {isLoading ? "Hamtar avsnitt..." : "Hamta senaste avsnitten"}
      </Button>
      {error ? <p className="text-xs text-red-400">{error}</p> : null}
    </div>
  );
}
