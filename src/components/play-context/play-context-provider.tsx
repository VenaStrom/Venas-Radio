"use client";

import { Channel, ChannelDB, Episode, EpisodeDB, ProgramDB, ProgressDB, Seconds } from "@/types/types";
import { useState, ReactNode, useEffect, useMemo, useRef, useCallback } from "react";
import { PlayContext } from "./play-context.internal";
import { fetchEpisodes } from "@/functions/episode-getter";
import { fetchChannels } from "@/functions/channel-getter";
import { fetchPrograms } from "@/functions/program-getter";
import { episodeDBDeserializer } from "../deserializer/episode-deserializer";
import { progressDBDeserializer } from "../deserializer/progress-deserializer";
import { migrateFromLegacyZustand } from "./legacy-zustand-migration";

export function PlayProvider({ children }: { children: ReactNode; }) {
  const [isFetchingEpisodes, setIsFetchingEpisodes] = useState(true);
  const [isFetchingChannels, setIsFetchingChannels] = useState(true);
  const [isFetchingPrograms, setIsFetchingPrograms] = useState(true);

  const [isPlaying, setIsPlaying] = useState(false);

  const [currentStreamUrl, setCurrentStreamUrl] = useState<string | null>(null);

  const [currentEpisode, setCurrentEpisode] = useState<Episode | null>(null);
  const [currentChannel, setCurrentChannel] = useState<Channel | null>(null);

  const [followedPrograms, setFollowedPrograms] = useState<number[]>([]);
  const [followedChannels, setFollowedChannels] = useState<number[]>([]);

  const [episodeDB, setEpisodeDB] = useState<EpisodeDB>({});
  const [channelDB, setChannelDB] = useState<ChannelDB>({});
  const [programDB, setProgramDB] = useState<ProgramDB>({});

  const [progressDB, setProgressDB] = useState<ProgressDB>({});
  const updateEpisodeProgress = (episodeID: Episode["id"], elapsed: Seconds | number) => {
    setProgressDB((prev) => ({
      ...prev,
      [episodeID]: typeof elapsed === "number" ? new Seconds(elapsed) : elapsed,
    }));
  };

  const sortedEpisodes = useMemo(() => {
    return Object.values(episodeDB).sort((a, b) => new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime());
  }, [episodeDB]);

  const currentProgress = useMemo(() => {
    if (currentEpisode) {
      return progressDB[currentEpisode.id] || 0;
    }
    return null;
  }, [currentEpisode, progressDB]);
  const setCurrentProgress = (elapsed: Seconds) => {
    if (currentEpisode) {
      updateEpisodeProgress(currentEpisode.id, elapsed);
    }
    else {
      console.warn("No current episode set; cannot set progress.");
    }
  };

  const playEpisode = useCallback((episodeId: Episode["id"]) => {
    const episode = episodeDB[episodeId];
    if (episode) {
      setCurrentEpisode(episode);
      setCurrentStreamUrl(episode.url);
      setIsPlaying(true);
    }
    else {
      console.warn(`Episode with ID ${episodeId} not found in episodeDB.`);
    }
  }, [episodeDB]);

  const playChannel = useCallback((channelId: Channel["id"]) => {
    const channel = channelDB[channelId];
    if (channel) {
      setCurrentChannel(channel);
      setCurrentStreamUrl(channel.url);
      setIsPlaying(true);
    }
    else {
      console.warn(`Channel with ID ${channelId} not found in channelDB.`);
    }
  }, [channelDB]);

  // On mount, read localStorage for saved state (if any)
  useEffect(() => {
    // First, migrate any legacy zustand-based data into the new keys
    migrateFromLegacyZustand();

    Promise.all([
      // LocalStorage
      async () => setFollowedPrograms(JSON.parse(localStorage.getItem("followedPrograms") || "[4923, 178, 2778, 4540]")),
      async () => setFollowedChannels(JSON.parse(localStorage.getItem("followedChannels") || "[]")),
      async () => setProgressDB(progressDBDeserializer(localStorage.getItem("progressDB"))), // Serialized Seconds as number

      // SessionStorage
      async () => setEpisodeDB(episodeDBDeserializer(sessionStorage.getItem("episodeDB"))),
      async () => setChannelDB(JSON.parse(sessionStorage.getItem("channelDB") || "{}")),
      async () => setProgramDB(JSON.parse(sessionStorage.getItem("programDB") || "{}")),
    ].map(fn => fn()));
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
        setIsFetchingEpisodes(false);
      });
  }, [followedPrograms]);

  // Fetch channels on mount
  useEffect(() => {
    fetchChannels()
      .then((allChannels) => {
        setChannelDB(prev => {
          const updatedDB = { ...prev, ...allChannels };
          sessionStorage.setItem("channelDB", JSON.stringify(updatedDB));
          return updatedDB;
        });
      })
      .catch((error) => {
        console.error("Error fetching channels:", error);
      })
      .finally(() => {
        setIsFetchingChannels(false);
      });
  }, []);

  // Fetch programs on mount
  useEffect(() => {
    fetchPrograms()
      .then((allPrograms) => {
        setProgramDB(prev => {
          const updatedDB = { ...prev, ...allPrograms };
          sessionStorage.setItem("programDB", JSON.stringify(updatedDB));
          return updatedDB;
        });
      })
      .catch((error) => {
        console.error("Error fetching programs:", error);
      })
      .finally(() => {
        setIsFetchingPrograms(false);
      });
  }, []);

  // Save progressDB to localStorage on change
  useEffect(() => {
    const serializedProgressDB: Record<string, number> = {};
    for (const [episodeID, seconds] of Object.entries(progressDB)) {
      if (typeof seconds === "number") {
        // In case poorly serialized data exists
        serializedProgressDB[episodeID] = seconds;
        continue;
      }
      serializedProgressDB[episodeID] = seconds.toNumber();
    }
    localStorage.setItem("progressDB", JSON.stringify(serializedProgressDB));
  }, [progressDB]);

  // Save followedPrograms to localStorage on change
  useEffect(() => {
    localStorage.setItem("followedPrograms", JSON.stringify(followedPrograms));
  }, [followedPrograms]);

  // Save followedChannels to localStorage on change
  useEffect(() => {
    localStorage.setItem("followedChannels", JSON.stringify(followedChannels));
  }, [followedChannels]);

  const playNextEpisode = () => {
    if (!currentEpisode) return;

    const currentIndex = sortedEpisodes.findIndex(ep => ep.id === currentEpisode.id);
    if (currentIndex === -1) return;

    const maxIndex = sortedEpisodes.length - 1;

    for (let i = currentIndex + 1; i <= maxIndex; i++) {
      const nextEpisodeCandidate = sortedEpisodes[i];
      if (!nextEpisodeCandidate) continue;
      if (
        progressDB[nextEpisodeCandidate.id]?.toNumber()
        >= nextEpisodeCandidate.duration.toNumber()
      ) continue; // Already fully listened to

      // Found the next unlistened episode
      playEpisode(nextEpisodeCandidate.id);
      break;
    }
  };

  const playPreviousEpisode = () => {
    if (!currentEpisode) return;

    const currentIndex = sortedEpisodes.findIndex(ep => ep.id === currentEpisode.id);
    if (currentIndex === -1) return;

    for (let i = currentIndex - 1; i >= 0; i--) {
      const prevEpisodeCandidate = sortedEpisodes[i];
      if (!prevEpisodeCandidate) continue;
      if (
        progressDB[prevEpisodeCandidate.id]?.toNumber()
        >= prevEpisodeCandidate.duration.toNumber()
      ) continue; // Already fully listened to

      // Found the previous unlistened episode
      playEpisode(prevEpisodeCandidate.id);
      break;
    }
  };

  // Restore current episode/channel on mount
  const hasRestoredCurrentRef = useRef(false);
  useEffect(() => {
    if (hasRestoredCurrentRef.current) return;

    const episodeIdsLoaded = Object.keys(episodeDB).length > 0;
    const channelIdsLoaded = Object.keys(channelDB).length > 0;
    if (!episodeIdsLoaded && !channelIdsLoaded) return;

    const storedEpisodeId = localStorage.getItem("currentEpisodeID");
    const storedChannelId = localStorage.getItem("currentChannelID");

    if (storedEpisodeId) {
      const id = Number(storedEpisodeId);
      const ep = episodeDB[id];
      if (ep) {
        hasRestoredCurrentRef.current = true;
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setCurrentEpisode(ep);
        setCurrentStreamUrl(ep.url);
        return;
      }
    }

    if (storedChannelId) {
      const id = Number(storedChannelId);
      const ch = channelDB[id];
      if (ch) {
        hasRestoredCurrentRef.current = true;
        setCurrentChannel(ch);
        setCurrentStreamUrl(ch.url);
        return;
      }
    }
    hasRestoredCurrentRef.current = true;
  }, [channelDB, episodeDB]);

  // Save currently playing episode to localStorage on change
  useEffect(() => {
    if (!hasRestoredCurrentRef.current) return;

    if (currentEpisode) {
      localStorage.setItem("currentEpisodeID", currentEpisode.id.toString());
    }
    else {
      localStorage.removeItem("currentEpisodeID");
    }
  }, [currentEpisode]);

  // Save currently playing channel to localStorage on change
  useEffect(() => {
    if (!hasRestoredCurrentRef.current) return;

    if (currentChannel) {
      localStorage.setItem("currentChannelID", currentChannel.id.toString());
    }
    else {
      localStorage.removeItem("currentChannelID");
    }
  }, [currentChannel]);

  return (
    <PlayContext.Provider
      value={{
        isPlaying,
        play: () => setIsPlaying(true),
        pause: () => setIsPlaying(false),
        currentStreamUrl,
        currentProgress,
        setCurrentStreamUrl,
        setCurrentProgress,
        currentEpisode,
        currentChannel,
        setCurrentChannel,
        progressDB,
        playEpisode,
        setCurrentEpisode,
        updateEpisodeProgress,
        episodeDB,
        isFetchingEpisodes,
        channelDB,
        isFetchingChannels,
        followedPrograms,
        setFollowedPrograms,
        followedChannels,
        setFollowedChannels,
        playChannel,
        isFetchingPrograms,
        programDB,
        playNextEpisode,
        playPreviousEpisode,
      }}
    >
      {children}
    </PlayContext.Provider>
  );
}
