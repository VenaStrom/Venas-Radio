import { Episode } from "@/types/episode";
import { create } from "zustand";

type EpisodeDictionary = { [episodeID: number]: Episode };

interface EpisodeStore {
    episodes: EpisodeDictionary;
    episodeProgress: { [episodeID: number]: number };
    setEpisodes: (episodes: EpisodeDictionary) => void;
    setEpisodeProgress: (episodeID: number, progress: number) => void;
}

export const useEpisodeStore = create<EpisodeStore>()((set) => ({
    episodes: {},
    episodeProgress: {},
    setEpisodes: (episodes) => set({ episodes }),
    setEpisodeProgress: (episodeID, progress) =>
        set((state) => ({
            episodeProgress: {
                ...state.episodeProgress,
                [episodeID]: progress,
            },
        })),
}));