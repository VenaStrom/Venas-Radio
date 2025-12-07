import { Episode, EpisodeDB } from "@/types/types";
import { useState, ReactNode, useEffect, useMemo } from "react";
import { PlayContext } from "./play-context.internal";
import { fetchEpisodes } from "@/functions/episode-getter";

export function PlayProvider({ children }: { children: ReactNode; }) {
  const [isFetching, setIsFetching] = useState(true);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentEpisode, setCurrentEpisode] = useState<Episode | null>(null);
  const [currentStreamUrl, setCurrentStreamUrl] = useState<string | null>(null);

  const [followedPrograms, setFollowedPrograms] = useState<string[]>([]);
  const [episodeDB, setEpisodeDB] = useState<EpisodeDB>({});

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

  const playEpisode = (episodeId: Episode["id"]) => {
    const episode = episodeDB[episodeId];
    if (episode) {
      setCurrentEpisode(episode);
      setCurrentStreamUrl(episode.url);
      setIsPlaying(true);
    }
    else {
      console.warn(`Episode with ID ${episodeId} not found in episodeDB.`);
    }
  };

  // On mount, read localStorage for saved state (if any)
  useEffect(() => {
    Promise.all([
      async () => setFollowedPrograms(JSON.parse(localStorage.getItem("followedPrograms") || "[4923, 178, 2778, 4540]")),
      async () => setEpisodeDB(JSON.parse(sessionStorage.getItem("episodeDB") || "{}")),
    ]);
  }, []);

  // Fetch episodes on mount and when followedPrograms changes
  useEffect(() => {
    if (followedPrograms.length === 0) return;

    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - 30);
    const toDate = new Date();
    toDate.setDate(toDate.getDate() + 7);

    fetchEpisodes(followedPrograms, { fromDate, toDate })
      .then((allEpisodes) => {
        setEpisodeDB((prev) => {
          const updatedDB = { ...prev, ...allEpisodes };
          sessionStorage.setItem("episodeDB", JSON.stringify(updatedDB));
          return updatedDB;
        });
      })
      .catch((error) => {
        console.error("Error fetching episodes:", error);
      })
      .finally(() => {
        setIsFetching(false);
      });
  }, [followedPrograms]);

  return (
    <PlayContext.Provider
      value={{
        isPlaying,
        play: () => setIsPlaying(true),
        pause: () => setIsPlaying(false),
        currentStreamUrl,
        setStreamUrl: (url: string) => setCurrentStreamUrl(url),
        currentProgress,
        setCurrentProgress,
        currentEpisode,
        episodeProgressMap,
        playEpisode,
        setCurrentEpisode,
        updateEpisodeProgressMap,
        episodeDB,
        isFetching,
      }}
    >
      {children}
    </PlayContext.Provider>
  );
}
