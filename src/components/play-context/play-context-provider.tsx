import { SR_Episode } from "@/types/api/episode";
import { Episode } from "@/types/types";
import { useState, ReactNode, useEffect, useMemo } from "react";
import { PlayContext } from "./play-context.internal";

export function PlayProvider({ children }: { children: ReactNode; }) {
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

  // Fetch programs and episodes
  useEffect(() => {
    if (followedPrograms.length === 0) return;

    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - 30);
    const toDate = new Date();
    toDate.setDate(toDate.getDate() + 7);

    const fetchEpisodes = async (programIds: string[]) => {
      const programLinks = programIds.map((programID) => `https://api.sr.se/api/v2/episodes/index?programid=${programID}&fromdate=${fromDate.toISOString().slice(0, 10)}&todate=${toDate.toISOString().slice(0, 10)}&format=json&pagination=false&audioquality=high`);

      const responses = await Promise.all(programLinks.map((link) => fetch(link).then((res) => res.json())));

      const allEpisodes: Record<Episode["id"], Episode> = {};

      for (const data of responses) {
        data.episodes
          .filter((episode: SR_Episode) => episode.listenpodfile || episode.downloadpodfile)
          .forEach((episode: SR_Episode) => {
            allEpisodes[episode.id] = {
              id: episode.id,
              title: episode.title,
              description: episode.description,
              url: episode?.listenpodfile?.url || episode?.downloadpodfile?.url,
              program: {
                id: episode.program.id,
                name: episode.program.name,
              },
              publishDate: new Date(parseInt(episode.publishdateutc.replace(/\D/g, ""))),
              duration: episode.listenpodfile.duration || episode.downloadpodfile.duration || 0,
              image: {
                square: episode.imageurl,
                wide: episode.imageurltemplate,
              },
            };
          });
      };

      setEpisodeDB((prev) => {
        const updatedDB = { ...prev, ...allEpisodes };
        sessionStorage.setItem("episodeDB", JSON.stringify(updatedDB));
        return updatedDB;
      });
    };

    fetchEpisodes(followedPrograms);
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
      }}
    >
      {children}
    </PlayContext.Provider>
  );
}
