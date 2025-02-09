"use client";

import { usePlayStateStore } from "@/store/play-state-store";
import { Episode } from "@/types/episode";
import { PlayPause } from "@/types/play-pause";
import * as Icon from "lucide-react";
import { useState } from "react";

/**
 * A play button component. It has some feature that initiate playing an episode.
 * @param {Episode} episodeData The Episode object associated with the play button that is used for playback
 * @param {string} role         What the button does on click. "starter" is the default role, and "controller" is used for controlling playback in the audio player for example.
 * @param {string} className    Is passed on the outer most element in this component for styling purposes.
 * @param {number} iconSize     The size of the icon in pixels.
 */
export default function PlayButton({ episodeData, role = "starter", className, iconSize = 24 }: { episodeData?: Episode, role?: "starter" | "controller", className?: string, iconSize?: number }) {
    const [buttonState, setButtonState] = useState<PlayPause>("paused");
    const playState = usePlayStateStore();

    const click = () => {
        if (role === "controller") {
            const currentState = playState.playState;
            const invertedState = currentState === "paused" ? "playing" : "paused";

            playState.setPlayState(invertedState);
            setButtonState(invertedState);
            return;
        }

        if (role === "starter" && episodeData) {
            if (buttonState === "paused") {
                playState.setCurrentEpisode(episodeData);
                playState.setPlayState("playing");
                setButtonState("playing");
                return;
            }
            if (buttonState === "playing") {
                playState.setPlayState("paused");
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
            const isThisEpisode = state.currentEpisode?.id === episodeData.id;

            // Reset the button state when not playing.
            if (!isThisEpisode) {
                setButtonState("paused");
                return;
            }

            // Match state with controller
            if (isThisEpisode) {
                setButtonState(state.playState);
                return;
            }
        }
    });

    const getIcon = () => {
        return buttonState === "paused"
            ? <Icon.Play size={iconSize} className="fill-zinc-100" />
            : <Icon.Pause size={iconSize} className="fill-zinc-100" />;
    };

    return (
        <button className={className} id={episodeData?.id.toString() || ""} onClick={click}>
            {getIcon()}
        </button>
    );
}