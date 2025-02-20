import { Episode } from "@/types/api/episode";
import { PlayPause } from "@/types/play-pause";
import { create } from "zustand";

export type PlayStateStore = {
    playState: PlayPause;
    togglePlayState: () => void;
    setPlayState: (paused: PlayPause) => void;

    currentEpisode: Episode | null;
    setCurrentEpisode: (episode: Episode) => void;

    cachedEpisode: Episode | null;
    setCachedEpisode: (episode: Episode) => void;
}

export const usePlayStateStore = create<PlayStateStore>()((set) => ({
    playState: "paused",
    togglePlayState: () => set((state) => ({ playState: state.playState === "paused" ? "playing" : "paused" })),
    setPlayState: (paused) => set({ playState: paused }),

    currentEpisode: null,
    setCurrentEpisode: (episode) => set({ currentEpisode: episode }),

    cachedEpisode: null,
    setCachedEpisode: (episode) => set({ cachedEpisode: episode }),
}));