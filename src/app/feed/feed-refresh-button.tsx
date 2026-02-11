"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

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
        const payload = await response.json().catch(() => null);
        const message = typeof payload?.error === "string"
          ? payload.error
          : "Kunde inte hamta avsnitt.";
        throw new Error(message);
      }

      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Kunde inte hamta avsnitt.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <Button onClick={handleClick} disabled={isLoading || programIds.length === 0}>
        {isLoading ? "Hamtar avsnitt..." : "Hamta senaste avsnitten"}
      </Button>
      {error ? <p className="text-xs text-red-400">{error}</p> : null}
    </div>
  );
}
