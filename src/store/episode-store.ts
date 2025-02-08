import { Episode } from "@/types/episode";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

type EpisodeDictionary = { [episodeID: number]: Episode };

interface EpisodeStore {
    episodeData: EpisodeDictionary;
    setEpisodeData: (episodeData: EpisodeDictionary) => void;
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
        }),
        {
            name: "episode-store",
            storage: createJSONStorage(() => safeLocalStorage),
        }
    )
);

// Subscribe
// useEpisodeStore.subscribe((state) => {
//     console.log("Episode Store", state);
// });