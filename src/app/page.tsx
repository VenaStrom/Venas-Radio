"use client";

import ChannelDOM, { ChannelSkeleton } from "@/components/channel-dom";
import { useContentStore } from "@/store/content-store";
import { useSettingsStore } from "@/store/settings-store";
import { Channel } from "@/types/api/channel";
import Link from "next/link";
import { useEffect, useState } from "react";

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export default function HomePage() {
  const { channels, setChannels, lastFetchedChannels } = useContentStore();
  const [isLoading, setIsLoading] = useState(true);
  const [renderCount, setRenderCount] = useState(6);
  const userSettings = useSettingsStore();

  useEffect(() => {
    const fetchChannels = async () => {
      const now = Date.now();
      if (channels.length > 0 && lastFetchedChannels && (now - lastFetchedChannels < CACHE_DURATION)) {
        setIsLoading(false);
        return;
      }

      const response = await fetch("https://api.sr.se/api/v2/channels?format=json&pagination=false");
      const data = await response.json();

      const allChannels: Channel[] = data.channels;

      // Save
      setChannels(allChannels);
      setIsLoading(false);
    };

    fetchChannels();
  }, [channels, setChannels, lastFetchedChannels]);

  useEffect(() => {
    // Janky staggard loading for performance reasons
    if (!isLoading && renderCount < channels.length - 6) {
      const interval = setInterval(() => {
        setRenderCount(prevCount => prevCount + 1);
      }, 100);

      return () => clearInterval(interval);
    }
  }, [isLoading, renderCount, channels]);

  return (
    <main>
      {/* Intro section */}
      <section className="w-full flex flex-col items-center text-center mt-10">
        <h1 className="text-2xl">Välkommen till Venas Radio</h1>

        <p>
          Venas Radio är en webbaserad radioapp som låter dig lyssna på radiokaneler och -program från Sveriges Radio, via deras <Link href={"https://api.sr.se/api/documentation/v2/index.html"}>öppna API</Link>.
        </p>
      </section>

      {/* Live Channels */}
      <section className="w-full flex flex-col items-center mt-20">
        <h2 className="mb-5">Lyssna live</h2>

        <ul className="w-full flex flex-col gap-y-9 last:pb-10">
          {isLoading ? (
            <>
              {new Array(10).fill(0).map((_, i) => (
                <ChannelSkeleton key={i} />
              ))}
            </>
          ) : (
            channels.sort((a, b) => {
              // If user is missing likedChannels, make them
              if (!userSettings.settings?.likedChannels) {
                userSettings.setSetting("likedChannels", []);
              }

              const aFav = userSettings.settings?.likedChannels?.includes(a.id) || false;
              const bFav = userSettings.settings?.likedChannels?.includes(b.id) || false;

              if (aFav && !bFav) return -1;
              if (!aFav && bFav) return 1;

              return 0;
            }).map((channel) => (
              <ChannelDOM channelData={channel} key={channel.id} />
            ))
          )}
        </ul>
      </section>
    </main>
  );
}