"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
  const [orderingFavorites, setOrderingFavorites] = useState<Set<string>>(
    () => new Set(followedChannels),
  );
  const previousChannelsRef = useRef<Channel[] | null>(null);

  useEffect(() => {
    if (previousChannelsRef.current !== channels) {
      previousChannelsRef.current = channels;
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setOrderingFavorites(new Set(followedChannels));
    }
  }, [channels, followedChannels]);

  const orderedChannels = useMemo(() => {
    return orderChannelsByFavorites(channels, orderingFavorites);
  }, [channels, orderingFavorites]);

  return (
    <ul className="w-full flex flex-col gap-y-4 pt-4 last:pb-10">
      {orderedChannels.map((channel) => (
        <ChannelDOM channel={channel} key={channel.id} />
      ))}
    </ul>
  );
}
