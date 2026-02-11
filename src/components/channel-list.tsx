"use client";

import { useMemo } from "react";
import type { Channel } from "@prisma/client";
import { usePlayContext } from "@/components/play-context/play-context-use";
import ChannelDOM from "@/components/channel-dom";

type ChannelListProps = {
  channels: Channel[];
};

function orderChannelsByFavorites(channels: Channel[], favoriteIds: Set<string>): Channel[] {
  if (favoriteIds.size === 0) return channels;

  const favorites: Channel[] = [];
  const others: Channel[] = [];
  for (const channel of channels) {
    if (favoriteIds.has(channel.id)) {
      favorites.push(channel);
    } else {
      others.push(channel);
    }
  }

  return favorites.concat(others);
}

export default function ChannelList({ channels }: ChannelListProps) {
  const { followedChannels } = usePlayContext();
  const orderedChannels = useMemo(() => {
    return orderChannelsByFavorites(channels, new Set(followedChannels));
  }, [channels, followedChannels]);

  return (
    <ul className="w-full flex flex-col gap-y-4 pt-4 last:pb-10">
      {orderedChannels.map((channel) => (
        <ChannelDOM channel={channel} key={channel.id} />
      ))}
    </ul>
  );
}
