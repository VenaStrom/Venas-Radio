"use server";

import "server-only";
import prisma from "@/lib/prisma";
import { cacheTag } from "next/cache";
import { Channel } from "@/prisma/client/client";
import Fuse from "fuse.js";

const channelSearchKeys: { name: keyof Channel; weight: number }[] = [
  { name: "name", weight: 0.7 },
  { name: "tagline", weight: 0.3 },
];

export async function getChannels({ search }: { search?: string } = {}) {
  "use cache";
  cacheTag("channels");

  const channels = await prisma.channel.findMany({
    orderBy: { name: "asc", },
  });

  const normalizedSearch = search?.trim();
  if (!normalizedSearch) {
    return channels;
  }

  const fuse = new Fuse(channels, { keys: channelSearchKeys });
  return fuse.search(normalizedSearch).map((result) => result.item);
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