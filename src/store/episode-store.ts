import { Episode } from "@/types/episode";
import { create } from "zustand";

type EpisodeDictionary = { [episodeID: number]: Episode };

interface EpisodeStore {
    episodeData: EpisodeDictionary;
    setEpisodeData: (episodeData: EpisodeDictionary) => void;
    episodeProgress: { [episodeID: number]: number };
    setEpisodeProgress: (episodeID: number, progress: number) => void;
}

export const useEpisodeStore = create<EpisodeStore>()((set) => ({
    episodeData: {},
    setEpisodeData: (episodeData) => set({ episodeData }),
    episodeProgress: {},
    setEpisodeProgress: (episodeID, progress) =>
        set((state) => ({
            episodeProgress: {
                ...state.episodeProgress,
                [episodeID]: progress,
            },
        })),
}));