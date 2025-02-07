import { Episode } from "@/types/episode";
import { PlayPause } from "@/types/play-pause";
import { create } from "zustand";

interface PlayStateStore {
    playState: PlayPause;
    togglePlayState: () => void;
    setPlayState: (paused: PlayPause) => void;

    currentEpisode: Episode | null;
    setCurrentEpisode: (episode: Episode) => void;
}

export const usePlayStateStore = create<PlayStateStore>()((set) => ({
    playState: "paused",
    togglePlayState: () => set((state) => ({ playState: state.playState === "paused" ? "playing" : "paused" })),
    setPlayState: (paused) => set({ playState: paused }),

    currentEpisode: null,
    setCurrentEpisode: (episode) => set({ currentEpisode: episode }),
}));


// log on every state change
// usePlayStateStore.subscribe(
//     (state) => console.log("New state", state),
// );