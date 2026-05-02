import type { Channel } from "@/api/lib/prisma/generated";
import { ChannelCard } from "@/app/components/cards/channel";
import { isChannel } from "@/types";
import { useEffect, useState } from "react";

export function LivePage(): React.ReactNode {
  const pageSize = 20;
  const [page, _setPage] = useState<number>(1);
  const [channels, setChannels] = useState<Channel[]>([]);

  // Get channels on mount
  useEffect(() => {
    async function fetchChannels() {
      const res = await fetch(`/api/channels?page=${page}&pagesize=${pageSize}`)
        .then(res => res.json() as unknown)
        .then(data => {
          if (typeof data !== "object" || data === null) {
            console.error(`Invalid response: no data`, { data });
            return null;
          }
          if (!Array.isArray(data)) {
            console.error(`Invalid response: "channels" is not an array`, { data });
            return null;
          }
          if (!data.every(isChannel)) {
            console.error(`Invalid response: some items in "channels" are not valid Channel objects`, { data });
            return null;
          }
          return data;
        });

      setChannels(prev => !prev ? prev : [
        ...prev,
        ...res ?? [],
      ]);
    }

    fetchChannels()
      .catch((err: unknown) => {
        console.error({ err });
      });
  }, [page]);

  return (
    <main className="flex flex-col gap-y-8">
      {/* Intro section */}
      <section className="w-full flex flex-col items-center text-center mt-12 h-(--intro-section-height)">
        <h1 className="text-2xl">Välkommen till Venas Radio</h1>
        <p>
          Venas Radio är en webbaserad radioapp som låter dig lyssna på radiokanaler och -program från Sveriges Radio, via deras <a href={"https://api.sr.se/api/documentation/v2/index.html"} target="_blank">öppna API</a>.
        </p>
      </section>

      {/* Live */}
      <section className="h-(--live-section-height) overflow-y-auto">
        <ul className="px-6 flex flex-col gap-y-4">
          {channels.map(c => (
            <ChannelCard key={c.id} channel={c} />
          ))}
        </ul>
      </section>
    </main>
  );
}