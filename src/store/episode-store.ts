import { Episode } from "@/types/episode";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

type EpisodeDictionary = { [episodeID: number]: Episode };
type ProgressState = { seconds: number; finished: boolean };
type ProgressDictionary = { [episodeID: number]: ProgressState };

interface EpisodeStore {
    episodeData: EpisodeDictionary;
    setEpisodeData: (episodeData: EpisodeDictionary) => void;
    episodeProgress: ProgressDictionary;
    setEpisodeProgress: (episodeID: number, progress: ProgressState) => void;
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

export const useEpisodeStore = create<EpisodeStore>()(
    persist(
        (set) => ({
            episodeData: {},
            setEpisodeData: (episodeData: EpisodeDictionary) => set({ episodeData }),
            episodeProgress: {},
            setEpisodeProgress: (episodeID: number, progress: ProgressState) =>
                set((state: EpisodeStore) => ({
                    episodeProgress: {
                        ...state.episodeProgress,
                        [episodeID]: progress,
                    },
                })),
        }),
        {
            name: "episode-store",
            storage: createJSONStorage(() => safeLocalStorage),
        }
    )
);