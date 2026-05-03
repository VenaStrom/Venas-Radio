import type { Channel } from "@/api/lib/prisma/generated";
import { ChannelCard } from "@/app/components/cards/channel";
import { isChannel, isObj } from "@/types";
import { useEffect, useState } from "react";

const cacheStaleTime = 604800000; // 7 days in milliseconds

export function LivePage(): React.ReactNode {
  const pageSize = 10;
  const [page, setPage] = useState<number>(1);

  const [allIds, setAllIds] = useState<number[] | null>(null);
  const [channels, setChannels] = useState<Record<number, Channel>>(() => LoadChannelsFromLocalStorage() ?? {});
  const [totalChannels, setTotalChannels] = useState<number | null>(null);

  // Get channels on mount
  useEffect(() => {
    async function fetchChannels() {
      const res = await fetch(`/api/channels?page=${page}&pagesize=${pageSize}`);
      const data = await res.json() as {
        channels: Channel[];
        progress: number;
        total: number;
        allIds: number[];
      };

      if (!data.channels.every(isChannel)) {
        throw new Error("Invalid channel data received from server.");
      }

      setTotalChannels(data.total);
      setAllIds(data.allIds);
      setChannels(prev => {
        const newLookup = { ...prev };
        for (const channel of data.channels) newLookup[channel.id] = channel;
        SaveChannelsToLocalStorage(newLookup);
        return newLookup;
      });
    }

    fetchChannels()
      .catch((err: unknown) => {
        console.error({ err });
      });
  }, [page]);

  // On scroll handler
  useEffect(() => {
    const channelList = document.getElementById("channel-ul") as HTMLUListElement | null;
    if (!channelList) return;

    const margin = 300; // Trigger loading a bit before reaching the end

    function onScroll() {
      const firstUnloaded = channelList?.querySelector("li[id^='to-be-loaded-']");
      if (firstUnloaded) {
        if (firstUnloaded) {
          const rect = firstUnloaded.getBoundingClientRect();
          if (rect.top < window.innerHeight + margin) {
            // Remove id to mark as loaded (and prevent multiple triggers)
            firstUnloaded.removeAttribute("id");

            setPage(prev => prev + 1);
          }
        }
      }
    }

    channelList.addEventListener("scroll", onScroll);
    return () => channelList.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <main className="flex flex-col gap-y-8">
      {/* Intro section */}
      <section className="w-full flex flex-col items-center text-center mt-12 px-6 h-(--intro-section-height)">
        <h1 className="text-2xl">Välkommen till<br />Venas Radio</h1>
        <p>
          Venas Radio är en webbaserad radioapp som låter dig lyssna på radiokanaler och -program från Sveriges Radio, via deras <a href={"https://api.sr.se/api/documentation/v2/index.html"} target="_blank">öppna API</a>.
        </p>
      </section>

      {/* Live */}
      <section className="h-(--live-section-height) overflow-y-auto" id="channel-ul">
        <span className="ps-4 text-center italic text-xs text-zinc-500">{totalChannels ?? "--"} kanaler</span>

        <ul className="px-6 flex flex-col gap-y-4 last:pb-20">
          {allIds
            ? allIds.map((id) => (
              channels[id]
                ? <ChannelCard key={id} channel={channels[id]} />
                : <ChannelCard.Skeleton key={id} id={`to-be-loaded-${id}`} />
            ))
            : new Array(pageSize).fill(0).map((_, i) =>
              <ChannelCard.Skeleton key={"channel-skeleton-" + i} />,
            )
          }
        </ul>
      </section>
    </main>
  );
}

function SaveChannelsToLocalStorage(channels: Record<number, Channel>) {
  try {
    const existing = localStorage.getItem("channels-lookup");
    if (existing) {
      const parsed = JSON.parse(existing) as unknown;
      if (isObj(parsed) && ("timestamp" in parsed) && typeof parsed.timestamp === "number") {
        const age = Date.now() - parsed.timestamp;
        if (age > cacheStaleTime) {
          console.info(`Existing channel data in localStorage is too old (${Math.round(age / 3600000)}h), overwriting.`);
        }
        else {
          console.info(`Existing channel data in localStorage is still fresh (${Math.round(age / 3600000)}h), not overwriting.`);
          return;
        }
      }
    }

    localStorage.setItem("channels-lookup", JSON.stringify({ channels, timestamp: Date.now() }));
    console.log("Saved channels to localStorage:", Object.keys(channels).length);
  }
  catch (err: unknown) {
    console.error("Failed to save channels to localStorage:", err);
  }
}

function LoadChannelsFromLocalStorage(): Record<number, Channel> | null {
  try {
    const data = localStorage.getItem("channels-lookup");
    if (!data) return null;

    const parsed = JSON.parse(data) as unknown;
    if (!isObj(parsed)) return null;

    // Stale data check
    if (("timestamp" in parsed) && typeof parsed.timestamp === "number") {
      const age = Date.now() - parsed.timestamp;
      if (age > cacheStaleTime) {
        console.info(`Channel data in localStorage is too old (${Math.round(age / 3600000)}h), ignoring.`);
        return null;
      }
    }

    // Type checking
    if (!("channels" in parsed) || !isObj(parsed.channels)) {
      console.warn("Invalid channel data in localStorage: missing or invalid 'channels' property, ignoring.");
      return null;
    }
    if (!Object.values(parsed.channels).every(isChannel)) {
      console.warn("Invalid channel data in localStorage, ignoring.");
      return null;
    }

    console.info(`Loaded ${Object.keys(parsed.channels).length} channels from localStorage.`);
    return parsed as Record<number, Channel>;
  }
  catch (err: unknown) {
    console.error("Failed to load channels from localStorage:", err);
    return null;
  }
}