import type { PlayId } from "@/types";
import { createContext } from "react";


export type PlayContextType = {
  playId: PlayId | null,
  isPlaying: boolean,
};

export const defaultPlayContext: PlayContextType = {
  playId: null,
  isPlaying: false,
};

export const PlayContext = createContext<PlayContextType>({ ...defaultPlayContext });