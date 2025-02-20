import { EpisodeMap } from "@/types/maps";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type EpisodeStore = {
    episodeData: EpisodeMap;
    setEpisodeData: (episodeData: EpisodeMap) => void;
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
            setEpisodeData: (episodeData: EpisodeMap) => set({ episodeData }),
        }),
        {
            name: "episode-store",
            storage: createJSONStorage(() => safeLocalStorage),
        }
    )
);