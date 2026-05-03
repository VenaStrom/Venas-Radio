import { PlayContext } from "@/app/context/play-context";
import { useContext } from "react";

export function usePlayContext() {
  if (!PlayContext) {
    throw new Error("usePlayContext must be used within a PlayContextProvider");
  }
  const play = useContext(PlayContext);
  if (!play) {
    throw new Error("usePlayContext must be used within a PlayContextProvider");
  }
  return play;
}