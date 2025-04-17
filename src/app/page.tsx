"use client";

import ChannelDOM, { ChannelSkeleton } from "@/components/channel-dom";
import { Channel } from "@/types-dir/api/channel";
import { ChannelMap } from "@/types-dir/maps";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function HomePage() {
  const [channelData, setChannelData] = useState<ChannelMap>({});
  const [isLoading, setIsLoading] = useState(true);
  const [renderCount, setRenderCount] = useState(6);

  useEffect(() => {
    const fetchChannels = async () => {
      const response = await fetch("https://api.sr.se/api/v2/channels?format=json&pagination=false");
      const data = await response.json();

      const allChannels: ChannelMap = {};

      data.channels.forEach((channel: Channel) => {
        allChannels[channel.id] = channel;
      });

      // Save
      setChannelData(allChannels);
      setIsLoading(false);
    };

    fetchChannels();
  }, []);

  useEffect(() => {
    // Janky staggard loading for performance reasons
    if (!isLoading && renderCount < Object.keys(channelData).length - 6) {
      const interval = setInterval(() => {
        setRenderCount(prevCount => prevCount + 1);
      }, 100);

      return () => clearInterval(interval);
    }
  }, [isLoading, renderCount, channelData]);

  return (
    <main>
      {/* Intro section */}
      <section className="w-full flex flex-col items-center text-center mt-10">
        <h1 className="text-2xl">Välkommen till Viggos Radio</h1>

        <p>
          Viggos Radio är en webbaserad radioapp som låter dig lyssna på radiokaneler och -program från Sveriges Radio, via deras <Link href={"https://api.sr.se/api/documentation/v2/index.html"}>öppna API</Link>.
        </p>
      </section>

      {/* Live Channels */}
      <section className="w-full flex flex-col items-center mt-20">
        <h2 className="mb-5">Lyssna live</h2>

        <ul className="w-full flex flex-col gap-y-11 last:pb-10">
          {isLoading ? (
            <>
              {new Array(10).fill(0).map((_, i) => (
                <ChannelSkeleton key={i} />
              ))}
            </>
          ) : (
            Object.values(channelData).slice(0, renderCount).map((channel) => (
              <ChannelDOM channelData={channel} key={channel.id} />
            ))
          )}
        </ul>
      </section>
    </main>
  );
}