"use client";

import ProgressBar from "@/components/progress-bar";
import PlayButton from "@/components/play-button";
import { PlayStateStore, usePlayStateStore } from "@/store/play-state-store";
import { ProgressStore, useProgressStore } from "@/store/progress-store";
import { ContentStore, useContentStore } from "@/store/content-store";
import { useEffect, useRef } from "react";
import type { Content } from "@/types/api/content";

const getNextEpisode = (
    contentStore: ContentStore,
    progressStore: ProgressStore,
    playStateStore: PlayStateStore,
): Content | null => {
    if (!playStateStore.currentEpisode) return null;

    const episodeData = Object.values(contentStore.contentData);

    // Sort the episodes by publish date
    episodeData.sort((a, b) => new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime());

    const episodeIDs = episodeData.map((episode) => episode.id.toString());

    // Find the index of the current episode
    const episodeIndex = episodeIDs.indexOf(playStateStore.currentEpisode.id.toString());
    if (episodeIndex === -1) return null; // Episode not found

    // Find the next episode that is not finished
    for (let i = episodeIndex + 1; i < episodeIDs.length; i++) {
        const episode = episodeData.find((episode) => episode.id.toString() === episodeIDs[i]) || null;
        if (!episode) continue;
        const isFinished = progressStore.episodeProgressMap[episode.id]?.finished;
        if (!isFinished) return episode;
    }

    return null;
};

const getPreviousEpisode = (
    contentStore: ContentStore,
    progressStore: ProgressStore,
    playStateStore: PlayStateStore,
): Content | null => {
    if (!playStateStore.currentEpisode) return null;

    const episodeData = Object.values(contentStore.contentData);

    // Sort the episodes by publish date
    episodeData.sort((a, b) => new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime());

    const episodeIDs = episodeData.map((episode) => episode.id.toString());

    // Find the index of the current episode
    const episodeIndex = episodeIDs.indexOf(playStateStore.currentEpisode.id.toString());
    if (episodeIndex === -1) return null; // Episode not found

    // Find the previous episode that is not finished
    for (let i = episodeIndex - 1; i >= 0; i--) {
        const episode = episodeData.find((episode) => episode.id.toString() === episodeIDs[i]) || null;
        if (!episode) continue;
        const isFinished = progressStore.episodeProgressMap[episode.id]?.finished;
        if (!isFinished) return episode;
    }

    return null;
};

/**
 * A component that displays audio controls and a progress bar 
 */
export default function AudioControls({ className }: { className?: string }) {
    // Stores
    const playStateStore = usePlayStateStore();
    const contentStore = useContentStore();
    const progressStore = useProgressStore();

    // Define audio things
    const audioURL = playStateStore.currentEpisode?.url;
    const audioRef = useRef<HTMLAudioElement>(null);
    const previousEpisodeIdRef = useRef<number | null>(null);
    const preloadRef = useRef<HTMLAudioElement | null>(null);

    // Sync audio ref"s state with global state
    useEffect(() => {
        if (!audioRef.current) return;

        if (playStateStore.currentEpisode && playStateStore.playState === "playing") {
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
            playStateStore.currentEpisode // Current episode exists
            &&
            playStateStore.currentEpisode.id !== (previousEpisodeIdRef.current || -1) // Episode has changed
        ) {
            previousEpisodeIdRef.current = playStateStore.currentEpisode.id;

            // Load progress if available
            const storedProgress = progressStore.episodeProgressMap[playStateStore.currentEpisode.id.toString()]?.seconds;
            if (storedProgress) audioRef.current.currentTime = storedProgress;

            // Preload the next episode
            const nextEpisode = getNextEpisode(contentStore, progressStore, playStateStore);
            if (nextEpisode) playStateStore.setPreloadEpisode(nextEpisode);
        }
    }, [audioRef, playStateStore, progressStore, contentStore]);

    // Handle progress updates
    useEffect(() => {
        if (!audioRef.current || !playStateStore.currentEpisode) return;

        audioRef.current.ontimeupdate = () => {
            if (!audioRef.current || !playStateStore.currentEpisode) return;
            if (!playStateStore.currentEpisode.meta.saveProgress) return;

            progressStore.setEpisodeProgress(playStateStore.currentEpisode.id.toString(), { seconds: audioRef.current.currentTime, finished: false });
        }
    }, [audioRef, playStateStore, progressStore, contentStore]);

    // Handle episode end
    useEffect(() => {
        if (!audioRef.current || !playStateStore.currentEpisode) return;

        // Play next on finish
        audioRef.current.onended = () => {
            if (!audioRef.current || !playStateStore.currentEpisode) return;

            // Set progress to finished
            progressStore.setEpisodeProgress(playStateStore.currentEpisode.id.toString(), { seconds: playStateStore.currentEpisode.duration || Infinity, finished: true });

            // Find the next episode
            const nextEpisode = getNextEpisode(contentStore, progressStore, playStateStore);
            if (nextEpisode) {
                playStateStore.setCurrentEpisode(nextEpisode);
            } else {
                // No next episode found
                playStateStore.setCurrentEpisode(null);
                console.info("No next episode found");
            }
        };
    }, [audioRef, progressStore, playStateStore, contentStore]);

    // Preload the next episode
    useEffect(() => {
        if (!preloadRef.current) return;

        if (playStateStore.preloadEpisode) {
            preloadRef.current = new Audio(playStateStore.preloadEpisode.url);
        }
    }, [audioRef, playStateStore]);

    const onProgressDrag = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (playStateStore.currentEpisode) {
            if (playStateStore.currentEpisode.meta.disableDragProgress) return;

            const newProgress = parseInt(e.target.value) / 100 * playStateStore.currentEpisode.duration;

            // Modify the audio element
            if (audioRef.current) {
                audioRef.current.currentTime = newProgress;
            }

            // Save in global store
            progressStore.setEpisodeProgress(playStateStore.currentEpisode.id.toString(), { seconds: newProgress, finished: false });
        }
    };

    const updateMediaSessionMetadata = () => {
        if ("mediaSession" in navigator && playStateStore.currentEpisode) {
            navigator.mediaSession.metadata = new MediaMetadata({
                title: playStateStore.currentEpisode.title,
                artist: playStateStore.currentEpisode.program.name,
                album: "Podcast",
                artwork: [
                    { src: playStateStore.currentEpisode.image.square, sizes: "96x96", type: "image/png" },
                    { src: playStateStore.currentEpisode.image.square, sizes: "128x128", type: "image/png" },
                    { src: playStateStore.currentEpisode.image.square, sizes: "192x192", type: "image/png" },
                    { src: playStateStore.currentEpisode.image.square, sizes: "256x256", type: "image/png" },
                    { src: playStateStore.currentEpisode.image.square, sizes: "384x384", type: "image/png" },
                    { src: playStateStore.currentEpisode.image.square, sizes: "512x512", type: "image/png" },
                ]
            });

            navigator.mediaSession.setActionHandler("play", () => {
                playStateStore.setPlayState("playing");
            });
            navigator.mediaSession.setActionHandler("pause", () => {
                playStateStore.setPlayState("paused");
            });
            navigator.mediaSession.setActionHandler("seekbackward", (details) => {
                if (audioRef.current) {
                    audioRef.current.currentTime = Math.max(audioRef.current.currentTime - (details.seekOffset || 10), 0);
                }
            });
            navigator.mediaSession.setActionHandler("seekforward", (details) => {
                if (audioRef.current) {
                    audioRef.current.currentTime = Math.min(audioRef.current.currentTime + (details.seekOffset || 10), audioRef.current.duration);
                }
            });
            navigator.mediaSession.setActionHandler("previoustrack", () => {
                const previousEpisode = getPreviousEpisode(contentStore, progressStore, playStateStore);
                if (previousEpisode) {
                    playStateStore.setCurrentEpisode(previousEpisode);
                }
            });
            navigator.mediaSession.setActionHandler("nexttrack", () => {
                const nextEpisode = getNextEpisode(contentStore, progressStore, playStateStore);
                if (nextEpisode) {
                    playStateStore.setCurrentEpisode(nextEpisode);
                }
            });
        }
    };

    useEffect(() => {
        updateMediaSessionMetadata();
    });

    const episodeInfo = playStateStore.currentEpisode && {
        programName: playStateStore.currentEpisode.program.name,
        episodeTitle: playStateStore.currentEpisode.title,
        progressSeconds: progressStore.episodeProgressMap[playStateStore.currentEpisode.id]?.seconds || 0,
        durationSeconds: playStateStore.currentEpisode.duration,
        percent: () => {
            if (!playStateStore.currentEpisode || !episodeInfo) return 0;
            if (episodeInfo.durationSeconds === 0) return 0;
            return episodeInfo.progressSeconds / episodeInfo.durationSeconds * 100;
        },
        getHHMMSS: (seconds: number) => {
            const hour = Math.floor(seconds / 3600);
            const minute = Math.floor(seconds / 60) % 60;
            const second = Math.floor(seconds % 60);
            return [hour, minute, second];
        },
        progress: (() => {
            if (!episodeInfo) return "00:00";

            const [hour, minute, second] = episodeInfo.getHHMMSS(episodeInfo.progressSeconds);
            if (hour > 0) {
                return `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}:${second.toString().padStart(2, "0")}`;
            }
            return `${minute.toString().padStart(2, "0")}:${second.toString().padStart(2, "0")}`;
        }),
        duration: (() => {
            if (!episodeInfo) return "00:00";

            const [hour, minute, second] = episodeInfo.getHHMMSS(episodeInfo.durationSeconds);
            if (hour > 0) {
                return `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}:${second.toString().padStart(2, "0")}`;
            }
            return `${minute.toString().padStart(2, "0")}:${second.toString().padStart(2, "0")}`;
        })
    }

    return (
        <div className={`w-full flex flex-col gap-y-2 ${className || ""}`}>
            <div className="w-full">
                {/* Progress bar */}
                <ProgressBar className="block top-0" progress={episodeInfo?.percent() || 0} />

                {/* Invisible thumb to progress */}
                <input className="block top-0 w-full h-0 z-10 scale-y-150 opacity-0" type="range" min="0" max="100"
                    value={episodeInfo?.percent() || 0}
                    onChange={onProgressDrag} />
            </div>

            {/* Audio element */}
            <audio ref={audioRef} src={audioURL}></audio>

            {/* Controls */}
            <div id="player" className="w-full flex flex-row justify-between items-center gap-x-3 px-3 mb-1">
                <div>
                    <p className="font-light text-sm">{episodeInfo?.programName}</p>
                    <p className="font-bold max-h-[3rem] overflow-hidden text-ellipsis whitespace-break-spaces">{episodeInfo?.episodeTitle || "Spelar inget"}</p>
                </div>

                <p className="text-sm text-zinc-400">
                    {episodeInfo ? `${episodeInfo.progress()}\u00a0/\u00a0${episodeInfo.duration()}` : ""}
                </p>

                <PlayButton iconSize={30} role="controller" />
            </div>
        </div>
    );
}