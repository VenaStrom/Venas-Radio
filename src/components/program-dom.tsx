"use client";

import { SR_Program } from "@/types/api/program";
import SRAttribute from "./sr-attribute";
import Image from "next/image";
import LikeButton from "./like-button";

export default function ProgramDOM({ programData, className }: { programData: SR_Program, className?: string }) {
    return (
        <li className={`grid grid-cols-[82px_1fr] grid-rows-[min_82px_min_min] gap-y-2 gap-x-3 ${className || ""}`}>
            {/* SR Attribute */}
            <SRAttribute className="col-span-2" />

            {/* Thumbnail */}
            <Image width={82} height={82} className="bg-zinc-600 rounded-md" src={""} overrideSrc={programData.programimage} alt="Programbild" fetchPriority="low" />

            {/* Header Text */}
            <div className="col-start-2 grid grid-cols-[1fr_auto] grid-rows-[auto_1fr] gap-x-2">
                {/* Program name */}
                <p className="col-start-1 text-base font-bold overflow-hidden">{programData.name}</p>

                {/* Other info */}
                <p className="col-start-1 text-xs font-normal text-zinc-300 overflow-hidden">{programData.broadcastinfo}</p>

                {/* Like button */}
                <LikeButton programID={programData.id}/>
            </div>

            {/* Description */}
            <p className="col-span-2 text-xs pt-1 font-normal overflow-hidden">{programData.description}</p>
        </li>
    );
}

export function ProgramSkeleton() {
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
                <div className="bg-zinc-600 rounded-md col-start-1 h-3 animate-pulse"></div>
            </div>

            {/* Description */}
            <div className="col-span-2 h-10 text-s pt-1 font-normal overflow-hidden animate-pulse"></div>
        </li>
    );
}