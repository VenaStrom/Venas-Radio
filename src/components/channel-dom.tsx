"use client";

import Image from "next/image";
import PlayButton from "./play-button";
import SRAttribute from "./sr-attribute";
import { CSSProperties } from "react";
import type { Channel } from "@/types/api/channel";
import type { Content } from "@/types/api/content";
import LikeButton from "./like-button";

export default function ChannelDOM({ channelData, className = "", style }: { channelData: Channel, className?: string, style?: CSSProperties }) {

  // It's hacky but... Let's squeeze the channelData into a Content structure
  // so we can use the PlayButton component without modifications
  const contentData: Content = {
    id: channelData.id,
    title: channelData.name,
    description: channelData.tagline,
    url: channelData.liveaudio.url,
    publishDate: new Date(),
    program: {
      id: channelData.id,
      name: channelData.name
    },
    duration: 0,
    image: {
      square: channelData.image,
      wide: channelData.imagetemplate
    },
    meta: {
      saveProgress: false,
      disableDragProgress: true
    }
  }

  return (
    <li className={`w-full flex flex-row h-28 items-center gap-x-4 ${className}`} style={style} id={channelData.id.toString()}>

      {/* Thumbnail */}
      <Image className="bg-zinc-600 rounded-md h-24 w-24 max-h-24 max-w-24 min-h-24 min-w-24" width={96} height={96} src={""} overrideSrc={channelData.image} alt="Kanalbild" fetchPriority="low"></Image>

      <div className="h-full flex flex-col justify-start items-start gap-y-1 flex-1">
        <div className="flex flex-row justify-between items-center w-full">
          {/* Channel name */}
          <p className="font-bold overflow-hidden flex flex-row gap-x-2 items-center">
            {channelData.name}
          </p>

          <div className="flex flex-row gap-x-4 items-center">
            <LikeButton channelID={channelData.id} />
            <PlayButton episodeData={contentData} iconSize={28} />
          </div>
        </div>

        <SRAttribute className="" />

        {/* Description */}
        <p className="text-xs font-normal col-span-2">
          {channelData.tagline}
        </p>

        <span className="flex-1"></span>

        <div className="flex flex-row justify-end items-center w-full">
        </div>
      </div>
    </li>
  );
}

export function ChannelSkeleton() {
  return (
    <li className="flex flex-row h-28 items-center gap-x-4 w-full">
      {/* Thumbnail */}
      <div className="bg-zinc-600 rounded-md size-24 animate-pulse"></div>

      {/* Header Text */}
      <div className="h-full flex-1 flex flex-col gap-y-1 pt-1">
        {/* Program name */}
        <div className="bg-zinc-600 rounded-md h-4 w-28 animate-pulse"></div>

        {/* Other info */}
        <div className="bg-zinc-600 rounded-sm h-3 animate-pulse w-36 mt-3"></div>
        <div className="bg-zinc-600 rounded-md h-6 animate-pulse w-36 mt-1"></div>
      </div>
    </li>
  );
}