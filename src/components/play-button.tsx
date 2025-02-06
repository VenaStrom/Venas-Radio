"use client";

import { Episode } from "@/types/episode";
import * as Icon from "lucide-react";
import { useState, useEffect } from "react";

export default function PlayButton({ episodeData, className, iconSize = 24 }: { episodeData?: Episode, className?: string, iconSize?: number }) {
    const [playing, setPlaying] = useState(false);

    const emitPause = () => {
        setPlaying(false);
        window.dispatchEvent(new CustomEvent("pause"));
    };

    const emitPlayID = () => {
        if (!episodeData) return;

        if (playing) {
            setPlaying(false);
            emitPause();
        }
        else {
            setPlaying(true);
            window.dispatchEvent(new CustomEvent("playID", { detail: { id: episodeData.id, url: episodeData.url } }));
        }
    };

    useEffect(() => {
        if (!episodeData) return;

        const listener = (e: Event) => {
            const customEvent = e as CustomEvent;

            // If the event is not for this episode, show stop
            if (customEvent.detail.id !== episodeData.id) {
                setPlaying(false);
            }
        };
        window.addEventListener("playID", listener);
        return () => {
            window.removeEventListener("playID", listener);
        };
    }, [episodeData]);

    const getIcon = () => {
        return playing
            ? <Icon.Pause size={iconSize} className="fill-zinc-100" />
            : <Icon.Play size={iconSize} className="fill-zinc-100" />;
    };

    return (
        <button onClick={emitPlayID} className={className}>
            {getIcon()}
        </button>
    );
}