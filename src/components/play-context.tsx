import { Episode } from "@/types/types";
import { createContext, useState, useContext, ReactNode, useEffect, useMemo } from "react";

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
  playEpisode: (episodeId: Episode["id"]) => void;
  setCurrentEpisode: (episode: Episode | null) => void;

  episodeProgressMap: Record<Episode["id"], number>;
  updateEpisodeProgressMap: (episodeId: Episode["id"], progress: number) => void;
};

const PlayContext = createContext<PlayContextType | undefined>(undefined);

export const PlayProvider = ({ children }: { children: ReactNode }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentEpisode, setCurrentEpisode] = useState<Episode | null>(null);
  const [currentStreamUrl, setCurrentStreamUrl] = useState<string | null>(null);

  const [followedPrograms, setFollowedPrograms] = useState<string[]>([]);
  const [episodeDB, setEpisodeDB] = useState<Record<Episode["id"], Episode>>({});

  const [episodeProgressMap, setEpisodeProgressMap] = useState<Record<Episode["id"], number>>({});
  const updateEpisodeProgressMap = (episodeId: Episode["id"], progress: number) => {
    setEpisodeProgressMap((prev) => ({
      ...prev,
      [episodeId]: progress,
    }));
  };

  const currentProgress = useMemo(() => {
    if (currentEpisode) {
      return episodeProgressMap[currentEpisode.id] || 0;
    }
    return null;
  }, [currentEpisode, episodeProgressMap]);

  const setCurrentProgress = (progress: number) => {
    if (currentEpisode) {
      updateEpisodeProgressMap(currentEpisode.id, progress);
    }
  };

  // On mount, read localStorage for saved state (if any)
  useEffect(() => {
    // const savedEpisodeId = localStorage.getItem("currentEpisodeId");    
    // const savedStreamUrl = localStorage.getItem("currentStreamUrl");
    // const savedProgressMap = localStorage.getItem("episodeProgressMap");
    Promise.all([
      async () => setFollowedPrograms(JSON.parse(localStorage.getItem("followedPrograms") || "[4923, 178, 2778, 4540]")),
    ]);
  }, []);

  // Fetch programs and episodes
  useEffect(() => {
    if (followedPrograms.length === 0) return;

    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - 30);
    const toDate = new Date();
    toDate.setDate(toDate.getDate() + 7);

    const fetchPrograms = async (programIds: string[]) => {
      const programLinks = programIds.map((programID) => `https://api.sr.se/api/v2/episodes/index?programid=${programID}&fromdate=${fromDate.toISOString().slice(0, 10)}&todate=${toDate.toISOString().slice(0, 10)}&format=json&pagination=false&audioquality=high`);

      const responses = await Promise.all(programLinks.map((link) => fetch(link).then((res) => res.json())));
    };

  }, [followedPrograms]);

  return (
    <PlayContext.Provider
      value={{
        isPlaying,
        play: () => setIsPlaying(true),
        pause: () => setIsPlaying(false),

        currentStreamUrl,
        setStreamUrl: setCurrentStreamUrl,

        currentProgress,
        setCurrentProgress,

        currentEpisode,
        setCurrentEpisode,

        episodeProgressMap,
        updateEpisodeProgressMap: updateEpisodeProgressMap,
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
