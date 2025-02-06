"use client";

import * as Icon from "lucide-react";
import { useState, useEffect } from "react";

export default function PlayButton({ episodeID, className, iconSize = 24 }: { episodeID?: string | number, className?: string, iconSize?: number }) {
    const [playing, setPlaying] = useState(false);

    const emitPlayID = () => {
        setPlaying(true);
        window.dispatchEvent(new CustomEvent("playID", { detail: { id: episodeID } }));
    };

    const emitPause = () => {
        setPlaying(false);
        window.dispatchEvent(new CustomEvent("pause"));
    };

    useEffect(() => {
        const listener = (e: Event) => {
            const customEvent = e as CustomEvent;

            // If the event is not for this episode, show stop
            if (customEvent.detail.id !== episodeID) {
                setPlaying(false);
            }
            // If the event is for this button, show pause and send pause event
            else {
                setPlaying(false);
                emitPause();
            }
        };
        window.addEventListener("playID", listener);
        return () => {
            window.removeEventListener("playID", listener);
        };
    }, [episodeID]);

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