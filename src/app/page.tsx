"use client";

import ChannelDOM, { ChannelSkeleton } from "@/components/channel-dom";
import { usePlayContext } from "@/components/play-context/play-context-use";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

export default function HomePage() {
  const { channelDB, isFetchingChannels, followedChannels } = usePlayContext();

  const [renderCount, setRenderCount] = useState(6);
  const channels = useMemo(() => {
    return Object.values(channelDB)
      .slice(0, renderCount)
      .sort((a, b) => {
        const aFollowed = followedChannels.includes(a.id) ? 0 : 1;
        const bFollowed = followedChannels.includes(b.id) ? 0 : 1;

        if (aFollowed !== bFollowed) {
          return aFollowed - bFollowed; // Followed channels first
        }
        return a.name.localeCompare(b.name); // Then sort by name
      });
  }, [channelDB, followedChannels, renderCount]);

  // Staggard rendering
  useEffect(() => {
    // Janky staggard loading for performance reasons
    if (!isFetchingChannels && renderCount < Object.keys(channelDB).length - 6) {
      const interval = setInterval(() => {
        setRenderCount(prevCount => prevCount + 1);
      }, 100);

      return () => clearInterval(interval);
    }
  }, [isFetchingChannels, channelDB, renderCount]);

  return (
    <main>
      {/* Intro section */}
      <section className="w-full flex flex-col items-center text-center mt-12">
        <h1 className="text-2xl">Välkommen till Venas Radio</h1>

        <p>
          Venas Radio är en webbaserad radioapp som låter dig lyssna på radiokanaler och -program från Sveriges Radio, via deras <Link href={"https://api.sr.se/api/documentation/v2/index.html"} target="_blank">öppna API</Link>.
        </p>
      </section>

      {/* Live Channels */}
      <section className="w-full flex flex-col items-center mt-16">
        <h2 className="mb-5">Lyssna live</h2>

        <ul className="w-full flex flex-col gap-y-4 last:pb-10">
          {isFetchingChannels ? (
            new Array(10).fill(0).map((_, i) => (
              <ChannelSkeleton key={i} />
            ))
          ) : (
            channels.map((channel) => (
              <ChannelDOM channelData={channel} key={channel.id} />
            ))
          )}
        </ul>
      </section>
    </main>
  );
}