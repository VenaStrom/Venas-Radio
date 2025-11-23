import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

type Settings = {
  fetchBack: number;
  fetchForward: number;
  programIDs: number[];
  compactView: boolean | undefined;
  likedChannels: number[] | undefined;
};

export type SettingsStore = {
  settings: Settings;
  setSetting: (key: keyof Settings, value: any) => void;
  setAllSettings: (settings: Settings) => void;
};

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

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      settings: {
        fetchBack: 4,
        fetchForward: 7,
        programIDs: [4923, 178, 2778, 4540],
        compactView: false,
        likedChannels: [],
      },
      setSetting: (key, value) =>
        set((state) => ({
          settings: {
            ...state.settings,
            [key]: value,
          },
        })),
      setAllSettings: (settings) =>
        set(() => ({
          settings,
        })),
    }),
    {
      name: "settings-store",
      storage: createJSONStorage(() => safeLocalStorage),
    }
  )
);