"use server";

import "server-only";
import prisma from "@/lib/prisma";
import { cacheTag } from "next/cache";
import { Channel } from "@prisma/client";
import Fuse from "fuse.js";

const channelSearchKeys: { name: keyof Channel; weight: number }[] = [
  { name: "name", weight: 0.7 },
  { name: "tagline", weight: 0.3 },
];

type GetChannelsOptions = {
  search?: string;
  userId?: string | null;
};

export async function getChannels({ search, userId }: GetChannelsOptions = {}) {
  "use cache";
  cacheTag("channels");

  const channels = await prisma.channel.findMany({
    orderBy: { name: "asc", },
  });

  const normalizedUserId = userId?.trim();
  let favoriteChannelIds: Set<string> | null = null;
  if (normalizedUserId) {
    const user = await prisma.user.findUnique({
      where: { id: normalizedUserId },
      select: { favorite_channels: { select: { id: true } } },
    });

    if (user?.favorite_channels?.length) {
      favoriteChannelIds = new Set(user.favorite_channels.map((channel) => channel.id));
    }
  }

  const normalizedSearch = search?.trim();
  if (!normalizedSearch) {
    return orderChannelsByFavorites(channels, favoriteChannelIds);
  }

  const fuse = new Fuse(channels, { keys: channelSearchKeys });
  const results = fuse.search(normalizedSearch).map((result) => result.item);
  return orderChannelsByFavorites(results, favoriteChannelIds);
}

function orderChannelsByFavorites(channels: Channel[], favoriteChannelIds: Set<string> | null): Channel[] {
  if (!favoriteChannelIds || favoriteChannelIds.size === 0) {
    return channels;
  }

  const favorites: Channel[] = [];
  const others: Channel[] = [];
  for (const channel of channels) {
    if (favoriteChannelIds.has(channel.id)) {
      favorites.push(channel);
    } else {
      others.push(channel);
    }
  }

  return favorites.concat(others);
}

export async function getChannelById(channelId: string): Promise<Channel | null> {
  "use cache";
  cacheTag("channels");

  const channel = await prisma.channel.findUnique({
    where: { id: channelId, },
  });

  return channel;
}

export async function getChannelsByIds(channelIds: string[]): Promise<Channel[]> {
  "use cache";
  cacheTag("channels");

  const channels = await prisma.channel.findMany({
    where: { id: { in: channelIds, }, },
    orderBy: { name: "asc", },
  });

  return channels;
}