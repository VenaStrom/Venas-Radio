"use client";

import Image from "next/image";
import PlayButton from "./play-button";
import SRAttribute from "./sr-attribute";
import { Channel } from "@/types/channel";
import { CSSProperties } from "react";
import { Episode } from "@/types/episode";

export default function ChannelDOM({ channelData, className, style }: { channelData: Channel, className?: string, style?: CSSProperties }) {

    // It's hacky but... Let's squeeze the channelData into Episode structure
    // so we can use the PlayButton component without modifications
    const episodeData: Episode = {
        id: channelData.id,
        title: channelData.name,
        description: channelData.tagline,
        url: channelData.siteurl,
        program: {
            id: channelData.id,
            name: channelData.name
        },
        audiopreference: "",
        audiopriority: "",
        audiopresentation: "",
        publishdateutc: "",
        imageurl: channelData.image,
        imageurltemplate: "",
        photographer: "",
        listenpodfile: {
            title: "",
            description: "",
            filesizeinbytes: 0,
            program: {
                id: channelData.id,
                name: channelData.name
            },
            availablefromutc: "",
            duration: 0,
            publishdateutc: "",
            id: channelData.liveaudio.id,
            url: channelData.liveaudio.url,
            statkey: ""
        },
        downloadpodfile: {
            title: "",
            description: "",
            filesizeinbytes: 0,
            program: {
                id: channelData.id,
                name: channelData.name
            },
            availablefromutc: "",
            duration: 0,
            publishdateutc: "",
            id: channelData.liveaudio.id,
            url: channelData.liveaudio.url,
            statkey: ""
        },
        broadcast: {
            availablestoputc: "",
            playlist: {
                duration: 0,
                publishdateutc: "",
                id: 0,
                url: "",
                statkey: ""
            },
            broadcastfiles: []
        },
        broadcasttime: {
            starttimeutc: "",
            endtimeutc: ""
        }
    };

    return (
        <li className={`w-full grid grid-cols-[96px_1fr] grid-rows-[min_min_min_1fr] gap-2 ${className}`} style={style} id={channelData.id.toString()}>
            {/* SR Attribute */}
            <SRAttribute className="col-span-2" />

            {/* Thumbnail */}
            <Image width={96} height={96} src={""} overrideSrc={channelData.image} alt="Avsnittsbild" className="bg-zinc-600 rounded-md" fetchPriority="low"></Image>

            {/* Header Text */}
            <div className="col-start-2 grid grid-cols-[1fr_auto] grid-rows-[auto_1fr] gap-1">
                <p className="col-start-1 text-sm font-light overflow-hidden">{channelData.channeltype}</p>
                <p className="col-start-1 text-sm font-bold overflow-hidden">{channelData.name}</p>

                <PlayButton episodeData={episodeData} iconSize={28} className="col-start-2 row-start-1 row-span-2" />
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