import { Channel } from "@/types/api/channel";
import { Program } from "@/types/api/program";
import { ContentMap } from "@/types/maps";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type ContentStore = {
  contentData: ContentMap;
  programs: Program[];
  channels: Channel[];
  lastFetchedPrograms: number | null;
  lastFetchedChannels: number | null;
  setPrograms: (programs: Program[]) => void;
  setChannels: (channels: Channel[]) => void;
  setContentData: (contentData: ContentMap) => void;
  appendContentData: (contentData: ContentMap) => void;
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


export const useContentStore = create<ContentStore>()(
  persist(
    (set) => ({
      contentData: {},
      programs: [],
      channels: [],
      lastFetchedPrograms: null,
      lastFetchedChannels: null,
      setPrograms: (programs: Program[]) => set({ programs, lastFetchedPrograms: Date.now() }),
      setChannels: (channels: Channel[]) => set({ channels, lastFetchedChannels: Date.now() }),
      setContentData: (contentData: ContentMap) => set({ contentData: contentData }),
      appendContentData: (contentData: ContentMap) => set((state) => ({
        contentData: { ...state.contentData, ...contentData },
      })),
    }),
    {
      name: "content-store",
      storage: createJSONStorage(() => safeLocalStorage),
    }
  )
);