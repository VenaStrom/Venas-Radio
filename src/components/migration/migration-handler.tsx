"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";

const OLD_DOMAIN = "vr-radio.tailad6f63.ts.net";
const NEW_DOMAIN = "vr.venastrom.se";
const MIGRATION_DISMISSED_KEY = "migrationPromptDismissed";
const MIGRATION_COMPLETED_KEY = "migrationCompleted";

function collectLocalStorage(): Record<string, string> {
  const payload: Record<string, string> = {};
  for (let i = 0; i < localStorage.length; i += 1) {
    const key = localStorage.key(i);
    if (!key) continue;
    payload[key] = localStorage.getItem(key) ?? "";
  }
  return payload;
}

export default function MigrationHandler() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const originInfo = useMemo(() => {
    if (typeof window === "undefined") return null;
    const hostname = window.location.hostname;
    const url = new URL(window.location.href);
    const migrateId = url.searchParams.get("migrate");
    return { hostname, url, migrateId };
  }, []);

  useEffect(() => {
    if (!originInfo) return;

    if (originInfo.hostname === OLD_DOMAIN) {
      const dismissed = localStorage.getItem(MIGRATION_DISMISSED_KEY);
      const completed = localStorage.getItem(MIGRATION_COMPLETED_KEY);
      if (!dismissed && !completed) {
        setShowPrompt(true);
      }
      return;
    }

    if (originInfo.hostname === NEW_DOMAIN && originInfo.migrateId) {
      const id = originInfo.migrateId;
      const load = async () => {
        try {
          const response = await fetch(`/api/migration/load?id=${encodeURIComponent(id)}`);
          if (!response.ok) throw new Error("Migration data not found");
          const data = (await response.json()) as { payload: Record<string, string> };
          for (const [key, value] of Object.entries(data.payload)) {
            localStorage.setItem(key, value);
          }
          localStorage.setItem(MIGRATION_COMPLETED_KEY, "true");
        } catch (err) {
          console.error(err);
        } finally {
          const nextUrl = new URL(window.location.href);
          nextUrl.searchParams.delete("migrate");
          window.history.replaceState({}, "", nextUrl.toString());
        }
      };
      void load();
    }
  }, [originInfo]);

  const onMigrate = async () => {
    setIsMigrating(true);
    setError(null);
    try {
      const payload = collectLocalStorage();
      const response = await fetch(`https://${NEW_DOMAIN}/api/migration/store`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ payload }),
      });
      if (!response.ok) throw new Error("Failed to store migration data");
      const data = (await response.json()) as { id: string };
      localStorage.setItem(MIGRATION_COMPLETED_KEY, "true");
      window.location.href = `https://${NEW_DOMAIN}/?migrate=${encodeURIComponent(data.id)}`;
    }
    catch {
      setError("Kunde inte flytta dina inställningar. Försök igen.");
    }
    finally {
      setIsMigrating(false);
    }
  };

  const onDismiss = () => {
    localStorage.setItem(MIGRATION_DISMISSED_KEY, "true");
    setShowPrompt(false);
  };

  if (!showPrompt || !originInfo || originInfo.hostname !== OLD_DOMAIN) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-lg rounded-lg bg-zinc-900 border border-zinc-800 p-6 shadow-xl">
        <h2 className="text-xl font-semibold">Ny domän</h2>
        <p className="mt-2 text-sm text-zinc-300">
          Venas Radio har flyttat till en ny domän. Vill du flytta dina sparade
          inställningar (favoriter och lyssningsprogress) till den nya sidan?
        </p>
        {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={onDismiss} disabled={isMigrating}>
            Inte nu
          </Button>
          <Button onClick={onMigrate} disabled={isMigrating}>
            {isMigrating ? "Flyttar..." : "Flytta inställningar"}
          </Button>
        </div>
      </div>
    </div>
  );
}
