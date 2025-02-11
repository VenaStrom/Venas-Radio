"use client";

import { useSettingsStore } from "@/store/settings-store";
import * as Icon from "lucide-react";
import { CSSProperties, useState } from "react";

export default function LikeButton(
    { programID, className, style }: { programID: number, className?: string, style?: CSSProperties }
) {
    const [liked, setLiked] = useState(false);
    const settingsStore = useSettingsStore();

    // Load state
    useState(() => {
        setLiked(settingsStore.settings.programIDs.includes(programID));
    });

    // Save state
    const toggleLike = () => {
        setLiked(!liked);
        settingsStore.setSetting("programIDs", Array.from(new Set([...settingsStore.settings.programIDs, programID])));
    };

    return (
        <button className={`size-min ${className}`} style={style}>
            <Icon.Heart
                className={liked ? "fill-zinc-100" : "none"}
                size={28}
                onClick={toggleLike}
            />
        </button>
    );
}