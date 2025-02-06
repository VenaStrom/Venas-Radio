"use client";

import ProgressBar from "./progress-bar";
import PlayButton from "./play-button";
import { useEffect, useState } from "react";

/**
 * A component that displays audio controls and a progress bar 
 */
export default function AudioControls() {
    const [controlState, setControlState] = useState({
        playing: false,
        playingID: null,
        nextID: null,
        playingURL: null,
    });

    useEffect(() => {
        const listener = (e: Event) => {
            const customEvent = e as CustomEvent;

            // If it's the same episode, toggle play/pause
            if (customEvent.detail.id === controlState.playingID) {
                setControlState({
                    ...controlState,
                    playing: !controlState.playing,
                });
            }
            // If it's a different episode, start playing
            else {
                setControlState({
                    ...controlState,
                    playing: true,
                    playingID: customEvent.detail.id,
                    playingURL: customEvent.detail.url,
                });
            }
        };
        window.addEventListener("playID", listener);
        return () => {
            window.removeEventListener("playID", listener);
        };
    }, [controlState]);

    useEffect(() => {
        const listener = () => {
            setControlState({
                ...controlState,
                playing: false,
            });
        };
        window.addEventListener("pause", listener);
        return () => {
            window.removeEventListener("pause", listener);
        };
    }, [controlState]);

    return (<>
        {/* Progress bar */}
        <ProgressBar progress={0} />

        {/* Controls */}
        <div id="player" className="flex flex-col items-center w-full px-5">
            <PlayButton iconSize={30} className="self-end" />
        </div>
    </>)
}