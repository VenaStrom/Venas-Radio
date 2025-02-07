"use client";

import ProgressBar from "./progress-bar";
import PlayButton from "./play-button";
import { usePlayStateStore } from "@/store/playing-state-store";
import { useEpisodeStore } from "@/store/episode-store";
import { useEffect, useRef, useState } from "react";

/**
 * A component that displays audio controls and a progress bar 
 */
export default function AudioControls() {
    const [currentProgress, setCurrentProgress] = useState(0);

    // When playing store is updated, update the UI
    const { currentEpisode, playState } = usePlayStateStore();
    const { episodeProgress } = useEpisodeStore();

    // Calculate progress
    let percentProgress = 0;
    if (currentEpisode && episodeProgress[currentEpisode.id]) {
        percentProgress = episodeProgress[currentEpisode.id] / (currentEpisode?.listenpodfile?.duration || currentEpisode?.downloadpodfile?.duration || 0);
        percentProgress *= 100;
    }

    const audioURL = currentEpisode?.listenpodfile?.url || currentEpisode?.downloadpodfile?.url || currentEpisode?.broadcast?.broadcastfiles[0]?.url || null;
    const audioRef = useRef<HTMLAudioElement>(null);
    useEffect(() => {
        if (audioRef.current) {
            if (playState === "playing" && currentEpisode) {
                audioRef.current.play();
            } else {
                audioRef.current.pause();
            }
        }
    }, [playState, currentEpisode]);

    // Load progress
    // Update progress only when the current episode changes
    useEffect(() => {
        if (audioRef.current && currentEpisode && episodeProgress[currentEpisode.id] !== undefined) {
            audioRef.current.currentTime = episodeProgress[currentEpisode.id] || 0;
        }
    }, [currentEpisode]);

    // Update progress for this component
    useEffect(() => {
        if (audioRef.current && currentEpisode) {
            audioRef.current.ontimeupdate = () => {
                if (!audioRef.current) return;
                setCurrentProgress(audioRef.current.currentTime);
            }
        }
    }, [currentEpisode]);

    // Update progress in store
    useEffect(() => {
        if (currentEpisode) {
            useEpisodeStore.getState().setEpisodeProgress(currentEpisode.id, currentProgress);
        }
    }, [currentProgress]);

    const episodeInfo = <>
        {currentEpisode?.title}
    </>;

    return (<>
        {/* Progress bar */}
        <ProgressBar progress={percentProgress} />

        <audio ref={audioRef} src={audioURL || undefined}></audio>

        {/* Controls */}
        <div id="player" className="grid grid-cols-[30px_1fr_30px] w-full px-5">
            <p className="col-start-2 text-center w-full">{currentEpisode ? episodeInfo : "Spelar inget"}</p>

            <PlayButton iconSize={30} role="controller" className="col-start-3" />
        </div>
    </>)
}