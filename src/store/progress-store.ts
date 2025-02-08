import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

type EpisodeProgressState = { seconds: number; finished: boolean };
type ProgressDictionary = { [episodeID: number]: EpisodeProgressState };

interface ProgressStore {
    episodeProgressMap: ProgressDictionary;
    setEpisodeProgress: (episodeID: number, progress: EpisodeProgressState) => void;
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

export const useProgressStore = create<ProgressStore>()(
    persist(
        (set) => ({
            episodeProgressMap: {},
            setEpisodeProgress: (episodeID: number, progress: EpisodeProgressState) =>
                set((state: ProgressStore) => ({
                    episodeProgressMap: {
                        ...state.episodeProgressMap,
                        [episodeID]: progress,
                    },
                })),
        }),
        {
            name: "progress-store",
            storage: createJSONStorage(() => safeLocalStorage),
        }
    )
);

// Subscribe
// useProgressStore.subscribe((state) => {
//     console.log("Progress Store", state);
// });