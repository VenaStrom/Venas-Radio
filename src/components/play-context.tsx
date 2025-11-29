import { Episode } from "@/types/types";
import { createContext, useState, useContext, ReactNode, useEffect } from "react";

type PlayContextType = {
  isPlaying: boolean;
  play: () => void;
  pause: () => void;

  currentStreamUrl: string | null;
  setStreamUrl: (url: string) => void;

  /** Number if there's a current episode or null if not and infinity if streaming  */
  currentProgress: number | null;
  setCurrentProgress: (progress: number) => void;

  currentEpisode: Episode | null;
  playEpisode: (episodeId: string) => void;
  setCurrentEpisode: (episode: Episode | null) => void;

  episodeProgressMap: Record<string, number>;
  setEpisodeProgressMap: (episodeId: string, progress: number) => void;
};

const PlayContext = createContext<PlayContextType | undefined>(undefined);


export const PlayProvider = ({ children }: { children: ReactNode }) => {
  const [isPlaying, setIsPlaying] = useState(false);

  // On mount, read localStorage for saved state (if any)
  useEffect(() => {
    const savedEpisodeId = localStorage.getItem("currentEpisodeId");
    const savedStreamUrl = localStorage.getItem("currentStreamUrl");
    const savedProgressMap = localStorage.getItem("episodeProgressMap");
  }, []);

  return (
    <PlayContext.Provider
      value={{
        
      }}
    >
      {children}
    </PlayContext.Provider>
  );
};

export const usePlayContext = (): PlayContextType => {
  const context = useContext(PlayContext);
  if (!context) {
    throw new Error("usePlayContext must be used within a PlayProvider");
  }
  return context;
};
