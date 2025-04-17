"use client";

import Image from "next/image";
import { PlayButton } from "./play-button";
import { SRAttribute } from "./sr-attribute";
import { CSSProperties } from "react";
import type { Channel } from "@/types-dir/api/channel";
import type { Content } from "@/types-dir/api/content";

export default function ChannelDOM({ channelData, className, style }: { channelData: Channel, className?: string, style?: CSSProperties }) {

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
    <li className={`w-full grid grid-cols-[96px_1fr] grid-rows-[min_min_min_1fr] gap-2 ${className || ""}`} style={style} id={channelData.id.toString()}>
      {/* SR Attribute */}
      <SRAttribute className="col-span-2" />

      {/* Thumbnail */}
      <Image width={96} height={96} src={""} overrideSrc={channelData.image} alt="Kanalbild" className="bg-zinc-600 rounded-md" fetchPriority="low"></Image>

      {/* Header Text */}
      <div className="col-start-2 grid grid-cols-[1fr_auto] grid-rows-[auto_1fr] gap-1">
        <p className="col-start-1 text-sm font-light overflow-hidden">{channelData.channeltype}</p>
        <p className="col-start-1 text-sm font-bold overflow-hidden">{channelData.name}</p>

        <PlayButton episodeData={contentData} iconSize={28} className="col-start-2 row-start-1 row-span-2" />
      </div>

      {/* Description */}
      <p className="text-xs pt-1 font-normal overflow-hidden col-span-2">{channelData.tagline}</p>
    </li>
  );
}

export function ChannelSkeleton() {
  return (
    <li className="grid grid-cols-[96px_1fr] grid-rows-[min_96px_min_min] gap-y-2 gap-x-3">
      {/* SR Attribute */}
      <div className="col-span-2 h-5"></div>

      {/* Thumbnail */}
      <div className="bg-zinc-600 rounded-md w-[96px] h-[96px] animate-pulse"></div>

      {/* Header Text */}
      <div className="col-start-2 grid grid-cols-[1fr_auto] gap-x-2 gap-y-1">
        {/* Program name */}
        <div className="bg-zinc-600 rounded-md col-start-1 h-5 animate-pulse"></div>

        {/* Other info */}
        <div className="bg-zinc-600 rounded-md col-start-1 h-3 animate-pulse"></div>
        {/* <div className="bg-zinc-600 rounded-md col-start-1 h-3 animate-pulse"></div> */}
      </div>

      {/* Description */}
      <div className="bg-zinc-600 rounded-md col-span-2 h-10 text-s pt-1 font-normal overflow-hidden animate-pulse"></div>
    </li>
  );
}