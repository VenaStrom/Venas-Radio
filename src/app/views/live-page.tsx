import type { Channel } from "@/api/lib/prisma/generated";
import { ChannelCard } from "@/app/components/cards/channel";
import { isChannel } from "@/types";
import { useEffect, useState } from "react";

export function LivePage(): React.ReactNode {
  const pageSize = 20;
  const [page, _setPage] = useState<number>(1);

  const [allIds, setAllIds] = useState<number[] | null>(null);
  const [channels, setChannels] = useState<Record<number, Channel>>({});
  const [totalChannels, setTotalChannels] = useState<number>(52);

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
        return newLookup;
      });
    }

    fetchChannels()
      .catch((err: unknown) => {
        console.error({ err });
      });
  }, [page]);

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
      <section className="h-(--live-section-height) overflow-y-auto">
        <span className="ps-4 text-center italic text-xs text-zinc-500">Kanaler {totalChannels}</span>

        <ul className="px-6 flex flex-col gap-y-4 last:pb-20">
          {allIds
            ? allIds.map((id) => (
              channels[id]
                ? <ChannelCard key={id} channel={channels[id]} />
                : <ChannelCard.Skeleton key={id} />
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