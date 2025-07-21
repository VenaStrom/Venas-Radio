import { ContentMap } from "@/types/maps";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type ContentStore = {
  contentData: ContentMap;
  lastFetched: number | null;
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
      lastFetched: null,
      setContentData: (contentData: ContentMap) => set({ contentData: contentData, lastFetched: Date.now() }),
      appendContentData: (contentData: ContentMap) => set((state) => ({
        contentData: { ...state.contentData, ...contentData },
        lastFetched: Date.now()
      })),
    }),
    {
      name: "content-store",
      storage: createJSONStorage(() => safeLocalStorage),
    }
  )
);