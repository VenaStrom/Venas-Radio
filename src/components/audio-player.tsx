"use client";

import ProgressBar from "./progress-bar";
import PlayButton from "./play-button";
import { PlayStateStore, usePlayStateStore } from "@/store/play-state-store";
import { ProgressStore, useProgressStore } from "@/store/progress-store";
import { EpisodeStore, useEpisodeStore } from "@/store/episode-store";
import { useEffect, useRef } from "react";
import { Episode } from "@/types/api/episode";
import { extractDuration } from "@/lib/utils";

const getNthNextEpisode = (nextIndex: number, episodeStore: EpisodeStore, progressStore: ProgressStore, playStateStore: PlayStateStore): Episode | null => {
    if (!playStateStore.currentEpisode) return null;


    const [episodeIDs, episodeData] = [Object.keys(episodeStore.episodeData) as string[], Object.values(episodeStore.episodeData) as Episode[]];

    // Find the index of the current episode
    const episodeIndex = episodeIDs.indexOf(playStateStore.currentEpisode.id.toString());
    if (episodeIndex === -1) return null; // Episode not found

    // Find the "index" property of this episode. This index is used for ordering episodes
    const episodeOrder = episodeData[episodeIndex]?.order || -1;
    if (episodeOrder === -1) return null; // Episode order not found

    // Find the next episode that is not finished
    for (let i = episodeOrder + 1; i < episodeIDs.length; i++) {
        const episode = episodeData.find((episode) => episode.order === i) || null;
        if (!episode) continue;
        if (!progressStore.episodeProgressMap[episode.id]?.finished) return episode;
    }

    return null;
};

/**
 * A component that displays audio controls and a progress bar 
 */
export default function AudioControls() {
    // Stores
    const playStateStore = usePlayStateStore();
    const episodeStore = useEpisodeStore();
    const progressStore = useProgressStore();

    // Define audio things
    const audioURL = playStateStore.currentEpisode?.listenpodfile?.url || playStateStore.currentEpisode?.downloadpodfile?.url || playStateStore?.currentEpisode?.broadcast?.broadcastfiles[0]?.url || null;
    const audioRef = useRef<HTMLAudioElement>(null);
    const previousEpisodeIdRef = useRef<string | null>(null);

    // Sync audio ref's state with global state
    useEffect(() => {
        if (!audioRef.current) return;

        if (playStateStore.playState === "playing" && playStateStore.currentEpisode) {
            audioRef.current.play();
        } else {
            audioRef.current.pause();
        }
    }, [audioRef, playStateStore]);

    // Load progress on episode change
    useEffect(() => {
        if (
            audioRef.current // Audio element exists
            &&
            playStateStore?.currentEpisode // Current episode exists
            &&
            playStateStore?.currentEpisode?.id?.toString() !== (previousEpisodeIdRef.current || "-1") // Episode has changed
        ) {
            const storedProgress = progressStore.episodeProgressMap[playStateStore.currentEpisode.id]?.seconds;
            if (storedProgress !== undefined) {
                audioRef.current.currentTime = storedProgress;
            }
            previousEpisodeIdRef.current = playStateStore.currentEpisode.id.toString();
        }
    }, [playStateStore.currentEpisode, progressStore.episodeProgressMap]);

    // Handle progress updates
    useEffect(() => {
        if (!audioRef.current) return;

        // Local state update
        audioRef.current.ontimeupdate = () => {
            if (!audioRef.current || !playStateStore.currentEpisode) return;

            progressStore.setEpisodeProgress(playStateStore.currentEpisode.id, { seconds: audioRef.current.currentTime, finished: false });
        }
    }, [audioRef, playStateStore, progressStore]);

    // Handle episode end and caching
    useEffect(() => {
        if (!audioRef.current || !playStateStore.currentEpisode) return;

        // If cache is empty, load next episode
        // TODO - implement

        // Play next on finish
        audioRef.current.onended = () => {
            if (!audioRef.current || !playStateStore.currentEpisode) return;

            // Set progress to finished
            progressStore.setEpisodeProgress(playStateStore.currentEpisode.id, { seconds: extractDuration(playStateStore.currentEpisode), finished: true });

            // Find the next episode
            const nextEpisode = getNthNextEpisode(1, episodeStore, progressStore, playStateStore);
            if (nextEpisode) {
                playStateStore.setCurrentEpisode(nextEpisode);
            }
        };
    }, [audioRef, progressStore, playStateStore, episodeStore]);

    // Info display for the episode
    const episodeInfo = playStateStore.currentEpisode ?
        (() => {
            const progressNumberSeconds: number = Math.floor(progressStore.episodeProgressMap[playStateStore.currentEpisode.id]?.seconds || 0);
            const durationNumberSeconds: number = Math.floor(playStateStore.currentEpisode?.listenpodfile.duration || playStateStore.currentEpisode?.downloadpodfile.duration || playStateStore.currentEpisode?.broadcast?.broadcastfiles[0]?.duration || 0);

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
                progressString = `${toStringAndPad(progress.hour)}:` + progressString;
            }
            if (duration.hour > 0) {
                durationString = `${toStringAndPad(duration.hour)}:` + durationString;
            }

            return (
                <div className="flex flex-row justify-between gap-x-2 items-center w-full">
                    <div>
                        <p className="font-light text-sm">{playStateStore.currentEpisode?.program.name}</p>
                        <p className="font-bold">{playStateStore.currentEpisode?.title}</p>
                    </div>

                    <p className="text-sm text-zinc-400">{progressString}&nbsp;/&nbsp;{durationString}</p>
                </div>
            )
        })()
        :
        "Spelar inget";

    // Progress bar keep up with percent progress
    const percentProgress = playStateStore.currentEpisode ? (progressStore.episodeProgressMap[playStateStore.currentEpisode.id]?.seconds || 0) / (playStateStore.currentEpisode?.listenpodfile?.duration || playStateStore.currentEpisode?.downloadpodfile?.duration || playStateStore.currentEpisode?.broadcast?.broadcastfiles[0]?.duration || 0) * 100 : 0;

    return (
        <div className="flex flex-col justify-start items-center gap-y-[inherit] w-full">
            {/* Progress bar */}
            <ProgressBar progress={percentProgress} />

            {/* Invisible thumb to progress */}
            <input className="w-full h-0 -mt-3 opacity-0" type="range" min="0" max="100" value={percentProgress || 0}
                onChange={(e) => {
                    if (playStateStore.currentEpisode) {
                        const newProgress = parseInt(e.target.value) / 100 * (playStateStore.currentEpisode?.listenpodfile?.duration || playStateStore.currentEpisode?.downloadpodfile?.duration || playStateStore.currentEpisode?.broadcast?.broadcastfiles[0]?.duration || 0);

                        // Modify the audio element
                        if (audioRef.current) {
                            audioRef.current.currentTime = newProgress;
                        }

                        // Save in global store
                        progressStore.setEpisodeProgress(playStateStore.currentEpisode.id, { seconds: newProgress, finished: false });
                    }
                }} />

            {/* Audio element */}
            <audio ref={audioRef} src={audioURL || undefined}></audio>

            {/* Controls */}
            <div id="player" className="flex flex-row justify-between items-center gap-x-4 w-full px-5">
                {episodeInfo}

                <PlayButton iconSize={30} role="controller" />
            </div>
        </div>
    );
}