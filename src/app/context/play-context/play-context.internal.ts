import type { PlayId } from "@/types";
import { createContext } from "react";

export type PlayContextType = {
  playId: PlayId | null,
  play: (playId: PlayId) => void,
  isPlaying: boolean,
  setIsPlaying: (isPlaying: boolean) => void,
};

export const defaultPlayContext: PlayContextType = {
  playId: null,
  play: () => { },
  isPlaying: false,
  setIsPlaying: () => { },
};

export const PlayContext = createContext<PlayContextType>({ ...defaultPlayContext });