import { ContentMap } from "@/types/maps";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type ContentStore = {
    contentData: ContentMap;
    setContentData: (contentData: ContentMap) => void;
    appendContentData: (contentData: ContentMap) => void;
}

const safeSessionStorage = {
    getItem: (name: string) =>
        typeof window !== "undefined" && window.sessionStorage
            ? window.sessionStorage.getItem(name)
            : null,
    setItem: (name: string, value: string) => {
        if (typeof window !== "undefined" && window.sessionStorage) {
            window.sessionStorage.setItem(name, value);
        }
    },
    removeItem: (name: string) => {
        if (typeof window !== "undefined" && window.sessionStorage) {
            window.sessionStorage.removeItem(name);
        }
    },
};


export const useContentStore = create<ContentStore>()(
    persist(
        (set) => ({
            contentData: {},
            setContentData: (contentData: ContentMap) => set({ contentData: contentData }),
            appendContentData: (contentData: ContentMap) => set((state) => ({ contentData: { ...state.contentData, ...contentData } })),
        }),
        {
            name: "content-store",
            storage: createJSONStorage(() => safeSessionStorage),
        }
    )
);