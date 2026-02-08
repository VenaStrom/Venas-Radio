"use client";

import { Channel, ChannelDB, Episode, EpisodeDB, ProgramDB, ProgressDB, Seconds } from "@/types/types";
import { useState, ReactNode, useEffect, useMemo, useRef, useCallback } from "react";
import { PlayContext } from "@/components/play-context/play-context.internal";

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
      setCurrentChannel(null);
      setCurrentEpisode(episode);
      setCurrentStreamUrl(episode.url);

      setIsPlaying(true);
      setTimeout(() => {
        // I don't like this but it's to jostle the audio player into playing
        setIsPlaying(true);
      }, 50);
    }
    else {
      console.warn(`Episode with ID ${episodeId} not found in episodeDB.`);
    }
  }, [episodeDB]);

  const playChannel = useCallback((channelId: Channel["id"]) => {
    const channel = channelDB[channelId];
    if (channel) {
      setCurrentEpisode(null);
      setCurrentChannel(channel);
      setCurrentStreamUrl(channel.url);
      setIsPlaying(true);
    }
    else {
      console.warn(`Channel with ID ${channelId} not found in channelDB.`);
    }
  }, [channelDB]);

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
  const hasInitializedPlaybackRef = useRef(false);
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

  useEffect(() => {
    if (currentEpisode || currentChannel) {
      hasInitializedPlaybackRef.current = true;
    }
  }, [currentEpisode, currentChannel]);

  // Save currently playing episode to localStorage on change
  useEffect(() => {
    if (!hasRestoredCurrentRef.current) return;

    if (currentEpisode) {
      localStorage.setItem("currentEpisodeID", currentEpisode.id.toString());
    }
    else {
      if (!hasInitializedPlaybackRef.current) return;
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
      if (!hasInitializedPlaybackRef.current) return;
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
