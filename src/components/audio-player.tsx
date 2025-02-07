"use client";

import ProgressBar from "./progress-bar";
import PlayButton from "./play-button";
import { usePlayStateStore } from "@/store/playing-state-store";
import { useEpisodeStore } from "@/store/episode-store";

/**
 * A component that displays audio controls and a progress bar 
 */
export default function AudioControls() {

    // When playing store is updated, update the UI
    const { currentEpisode, playState: isPaused } = usePlayStateStore();
    const { episodeProgress } = useEpisodeStore();

    let percentProgress = 0;
    if (currentEpisode && episodeProgress[currentEpisode.id]) {
        percentProgress = episodeProgress[currentEpisode.id] / (currentEpisode?.listenpodfile?.duration || currentEpisode?.downloadpodfile?.duration || 0);
        percentProgress *= 100;
    }

    return (<>
        {/* Progress bar */}
        <ProgressBar progress={percentProgress} />

        {/* Controls */}
        <div id="player" className="flex flex-col items-center w-full px-5">
            <PlayButton iconSize={30} role="controller" className="self-end" />
        </div>
    </>)
}