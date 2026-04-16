import { useContext } from "react";
import type { PlayContextType } from "@/components/play-context/play-context.internal";
import { PlayContext } from "@/components/play-context/play-context.internal";

export function usePlayContext(): PlayContextType {
  const context = useContext(PlayContext);
  if (!context) {
    throw new Error("usePlayContext must be used within a PlayProvider");
  }
  return context;
}
