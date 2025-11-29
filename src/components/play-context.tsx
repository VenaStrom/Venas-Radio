import React, { createContext, useState, useContext, ReactNode } from "react";

type PlayContextType = {
  isPlaying: boolean;
  play: () => void;
  pause: () => void;
  currentEpisodeId: string | null;
  setEpisode: (episodeId: string) => void;
  currentStreamUrl: string | null;
  setStreamUrl: (url: string) => void;
};

const PlayContext = createContext<PlayContextType | undefined>(undefined);

export const PlayProvider = ({ children }: { children: ReactNode }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentEpisodeId, setCurrentEpisodeId] = useState<string | null>(null);
  const [currentStreamUrl, setCurrentStreamUrl] = useState<string | null>(null);

  const play = () => setIsPlaying(true);
  const pause = () => setIsPlaying(false);
  const setEpisode = (episodeId: string) => setCurrentEpisodeId(episodeId);
  const setStreamUrl = (url: string) => setCurrentStreamUrl(url);

  return (
    <PlayContext.Provider
      value={{
        isPlaying,
        play,
        pause,
        currentEpisodeId,
        setEpisode,
        currentStreamUrl,
        setStreamUrl,
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
