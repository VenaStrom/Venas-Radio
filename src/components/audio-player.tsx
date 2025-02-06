"use client";

import ProgressBar from "./progress-bar";
import PlayButton from "./play-button";
import { useState } from "react";

/**
 * A component that displays audio controls and a progress bar 
 */
export default function AudioControls() {
    const [controlState, setControlState] = useState({
        playing: false,
        playingID: null,
        nextID: null,
    });

    return (<>
        {/* Progress bar */}
        <ProgressBar progress={0} />

        {/* Controls */}
        <div id="player" className="flex flex-col items-center w-full px-5">
            <PlayButton iconSize={30} className="self-end" />
        </div>
    </>)
}