"use client";

import { Episode } from "@/types/episode";
import * as Icon from "lucide-react";
import { useState } from "react";

export default function PlayButton({ episodeData, className, iconSize = 24 }: { episodeData?: Episode, className?: string, iconSize?: number }) {
    const [playing, setPlaying] = useState(false);

    const getIcon = () => {
        return playing
            ? <Icon.Pause size={iconSize} className="fill-zinc-100" />
            : <Icon.Play size={iconSize} className="fill-zinc-100" />;
    };

    return (
        <button className={className} id={episodeData?.id.toString() || ""} onClick={() => setPlaying(!playing)}>
            {getIcon()}
        </button>
    );
}