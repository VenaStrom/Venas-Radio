import type { Content } from "@/types/api/content";
import type { PlayPause } from "@/types/play-pause";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type PlayStateStore = {
    playState: PlayPause;
    togglePlayState: () => void;
    setPlayState: (paused: PlayPause) => void;

    currentEpisode: Content | null;
    setCurrentEpisode: (episode: Content | null) => void;
}

const safeLocalStorage = {
    getItem: (name: string) =>
        typeof window !== "undefined" && window.localStorage
            ? window.localStorage.getItem(name)
            : null,
    setItem: (name: string, value: string) => {
        if (typeof window !== "undefined" && window.localStorage) {
            window.localStorage.setItem(name, value);
        }
    },
    removeItem: (name: string) => {
        if (typeof window !== "undefined" && window.localStorage) {
            window.localStorage.removeItem(name);
        }
    },
};

export const usePlayStateStore = create<PlayStateStore>()(
    persist(
        (set) => ({
            playState: "paused",
            togglePlayState: () => set((state) => ({ playState: state.playState === "paused" ? "playing" : "paused" })),
            setPlayState: (paused) => set({ playState: paused }),

            currentEpisode: null,
            setCurrentEpisode: (episode) => set({ currentEpisode: episode }),
        }),
        {
            name: "play-state-store",
            storage: createJSONStorage(() => safeLocalStorage),
            partialize: (state) => ({
                currentEpisode: state.currentEpisode,
            }),
        }
    )
);