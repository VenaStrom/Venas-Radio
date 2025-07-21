"use client";

import { usePlayStateStore } from "@/store/play-state-store";
import { useProgressStore } from "@/store/progress-store";
import type { Content } from "@/types/api/content";
import type { PlayPause } from "@/types/play-pause";
import { PauseIcon, PlayIcon } from "lucide-react";
import { useState } from "react";

/**
 * A play button component. It has some feature that initiate playing an episode.
 * @param episodeData The Episode object associated with the play button that is used for playback
 * @param role         What the button does on click. "starter" is the default role, and "controller" is used for controlling playback in the audio player for example.
 * @param className    Is passed on the outer most element in this component for styling purposes.
 * @param iconSize     The size of the icon in pixels.
 */
export default function PlayButton({
    episodeData,
    role = "starter",
    className,
    iconSize = 24
}: {
    episodeData?: Content,
    role?: "starter" | "controller",
    className?: string,
    iconSize?: number
}) {
    const [buttonState, setButtonState] = useState<PlayPause>("paused");
    const playStateStore = usePlayStateStore();
    const progressStore = useProgressStore();

    const click = () => {
        if (role === "controller") {
            const currentState = playStateStore.playState;
            const invertedState = currentState === "paused" ? "playing" : "paused";

            playStateStore.setPlayState(invertedState);
            setButtonState(invertedState);
            return;
        }

        if (role === "starter" && episodeData) {
            if (buttonState === "paused") {
                // If the episode is finished, reset the progress
                const episodeProgress = progressStore.episodeProgressMap[episodeData.id];
                if (episodeProgress?.finished) {
                    progressStore.setEpisodeProgress(episodeData.id.toString(), { seconds: 0, finished: false });
                }

                // Set the current episode and play it
                playStateStore.setCurrentEpisode(episodeData);
                playStateStore.setPlayState("playing");
                setButtonState("playing");
                return;
            }
            if (buttonState === "playing") {
                playStateStore.setPlayState("paused");
                setButtonState("paused");
                return;
            }
        };
    };

    // Pause if another episode is playing
    usePlayStateStore.subscribe((state) => {

        // Sync controller with global state
        if (role === "controller") {
            setButtonState(state.playState);
            return;
        }

        // Set starter state depending on the current episode
        if (role === "starter" && episodeData) {
            const isSameEpisode = state.currentEpisode?.id === episodeData.id;

            // Set the button state to the global state
            if (isSameEpisode) {
                setButtonState(state.playState);
                return;
            }

            // Reset the button state when another thing is playing
            setButtonState("paused");
        }
    });

    const getIcon = () => {
        return buttonState === "paused"
            ? <PlayIcon size={iconSize} className="fill-zinc-100" />
            : <PauseIcon size={iconSize} className="fill-zinc-100" />;
    };

    return (
        <button className={className || ""} id={episodeData?.id.toString() || ""} onClick={click}>
            {getIcon()}
        </button>
    );
}