import { Episode } from "@/types/episode";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

type EpisodeDictionary = { [episodeID: number]: Episode };

interface EpisodeStore {
    episodeData: EpisodeDictionary;
    setEpisodeData: (episodeData: EpisodeDictionary) => void;
    episodeProgress: { [episodeID: number]: number };
    setEpisodeProgress: (episodeID: number, progress: number) => void;
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
            setEpisodeProgress: (episodeID: number, progress: number) =>
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