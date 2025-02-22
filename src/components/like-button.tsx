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
        const newState = !liked;

        setLiked(newState);

        if (newState) {
            settingsStore.setSetting("programIDs", Array.from(new Set([...settingsStore.settings.programIDs, programID])));
        }
        else {
            settingsStore.setSetting("programIDs", settingsStore.settings.programIDs.filter(id => id !== programID));
        }
    };

    return (
        <button className={`size-min ${className || ""}`} style={style}>
            <Icon.Heart
                className={liked ? "fill-[red] !text-[red]" : "none"}
                size={28}
                onClick={toggleLike}
            />
        </button>
    );
}