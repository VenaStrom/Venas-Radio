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

    const episodeInfo = currentEpisode ?
        (() => {
            const progressNumberSeconds: number = Math.floor(episodeProgress[currentEpisode.id]);
            const durationNumberSeconds: number = Math.floor(currentEpisode?.listenpodfile.duration || currentEpisode?.downloadpodfile.duration || currentEpisode?.broadcast?.broadcastfiles[0]?.duration || 0);

            const progress = {
                hour: Math.floor(progressNumberSeconds / 3600),
                minute: Math.floor(progressNumberSeconds / 60) % 60,
                second: progressNumberSeconds % 60,
            }
            const duration = {
                hour: Math.floor(durationNumberSeconds / 3600),
                minute: Math.floor(durationNumberSeconds / 60) % 60,
                second: durationNumberSeconds % 60,
            }

            const toStringAndPad = (number: number) => number.toString().padStart(2, "0");

            let progressString = `${toStringAndPad(progress.minute)}:${toStringAndPad(progress.second)}`;
            let durationString = `${toStringAndPad(duration.minute)}:${toStringAndPad(duration.second)}`;

            if (progress.hour > 0) {
                progressString = `${toStringAndPad(progress.hour)}` + progressString;
            }
            if (duration.hour > 0) {
                durationString = `${toStringAndPad(duration.hour)}` + durationString;
            }

            return (
                <div className="flex flex-row justify-between items-center w-full">
                    <div>
                        <p className="font-light text-sm">{currentEpisode?.program.name}</p>
                        <p className="font-bold">{currentEpisode?.title}</p>
                    </div>

                    <p className="text-sm text-zinc-400">{progressString}/{durationString}</p>
                </div>
            )
        })()
        :
        "Spelar inget";

    return (<>
        {/* Progress bar */}
        <ProgressBar progress={percentProgress} />

        <audio ref={audioRef} src={audioURL || undefined}></audio>

        {/* Controls */}
        <div id="player" className="flex flex-row justify-between items-center gap-x-4 w-full px-5">
            {episodeInfo}

            <PlayButton iconSize={30} role="controller" />
        </div>
    </>)
}