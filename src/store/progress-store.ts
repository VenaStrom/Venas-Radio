import type { EpisodeProgress, ProgressMap } from "@/types/maps";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type ProgressStore = {
  episodeProgressMap: ProgressMap;
  setEpisodeProgress: (episodeID: string, progress: EpisodeProgress) => void;
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
      setEpisodeProgress: (episodeID: string, progress: EpisodeProgress) =>
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