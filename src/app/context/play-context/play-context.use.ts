import { PlayContext } from "@/app/context/play-context/play-context.internal";


export function usePlayContext() {
  if (!PlayContext) {
    throw new Error("usePlayContext must be used within a PlayContextProvider");
  }
  return PlayContext;
}