import { useContext } from "react";
import { PlayContext, PlayContextType } from "@/components/play-context/play-context.internal";

export function usePlayContext(): PlayContextType {
  const context = useContext(PlayContext);
  if (!context) {
    throw new Error("usePlayContext must be used within a PlayProvider");
  }
  return context;
}
