"use client";

import type { Channel, ChannelDB, Episode, EpisodeDB, EpisodeWithProgram, PlayableMedia, Program, ProgramDB, ProgressDB } from "@/types/types";
import { Seconds } from "@/types/types";
import { useState, ReactNode, useEffect, useMemo, useRef, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import { PlayContext } from "@/components/play-context/play-context.internal";
import { progressDBDeserializer } from "@/components/deserializer/progress-deserializer";

type PendingMedia = { type: "episode" | "channel"; id: string; } | null;

type RemoteUserState = {
  progress?: Record<string, number>;
  followedPrograms?: string[];
  followedChannels?: string[];
};

function readStoredIdList(key: string): string[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(key);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as string[] | number[];
    return parsed.map((id) => id.toString()).filter(Boolean);
  }
  catch {
    console.warn(`Failed to parse ${key} from localStorage.`);
    return [];
  }
}

function readStoredProgress(): ProgressDB {
  if (typeof window === "undefined") return {};
  return progressDBDeserializer(localStorage.getItem("progressDB"));
}

function normalizeProgressPayload(payload?: Record<string, number>): ProgressDB {
  if (!payload) return {};
  const normalized: ProgressDB = {};
  for (const [episodeId, value] of Object.entries(payload)) {
    if (!episodeId) continue;
    if (!Number.isFinite(value)) continue;
    normalized[episodeId.toString()] = Seconds.from(value);
  }
  return normalized;
}

function serializeProgressDB(payload: ProgressDB): Record<string, number> {
  return Object.fromEntries(
    Object.entries(payload).map(([episodeId, seconds]) => [episodeId, seconds.toNumber()])
  );
}

function mergeProgress(local: ProgressDB, remote: ProgressDB): ProgressDB {
  const merged: ProgressDB = { ...local };
  for (const [episodeId, seconds] of Object.entries(remote)) {
    const localSeconds = merged[episodeId];
    if (!localSeconds || seconds.toNumber() > localSeconds.toNumber()) {
      merged[episodeId] = seconds;
    }
  }
  return merged;
}

function readStoredMedia(): { restoredMedia: PlayableMedia | null; pending: PendingMedia } {
  if (typeof window === "undefined") return { restoredMedia: null, pending: null };

  const storedMediaRaw = localStorage.getItem("currentMedia");
  if (storedMediaRaw) {
    try {
      const parsed = JSON.parse(storedMediaRaw) as PlayableMedia;
      if (parsed?.id && parsed?.url && (parsed.type === "episode" || parsed.type === "channel")) {
        return { restoredMedia: parsed, pending: { type: parsed.type, id: parsed.id } };
      }
    }
    catch {
      console.warn("Failed to parse currentMedia from localStorage.");
    }
  }

  const storedEpisodeId = localStorage.getItem("currentEpisodeID");
  if (storedEpisodeId) {
    return { restoredMedia: null, pending: { type: "episode", id: storedEpisodeId } };
  }

  const storedChannelId = localStorage.getItem("currentChannelID");
  if (storedChannelId) {
    return { restoredMedia: null, pending: { type: "channel", id: storedChannelId } };
  }

  return { restoredMedia: null, pending: null };
}

export function PlayProvider({ children }: { children: ReactNode; }) {
  const { isLoaded, isSignedIn } = useUser();
  const [isFetchingEpisodes, _setIsFetchingEpisodes] = useState(true);
  const [isFetchingChannels, _setIsFetchingChannels] = useState(true);
  const [isFetchingPrograms, _setIsFetchingPrograms] = useState(true);

  const [isPlaying, setIsPlaying] = useState(false);

  const initialMedia = useMemo(() => readStoredMedia(), []);
  const [currentStreamUrl, setCurrentStreamUrl] = useState<string | null>(initialMedia.restoredMedia?.url ?? null);

  const [currentEpisode, setCurrentEpisode] = useState<EpisodeWithProgram | null>(null);
  const [currentChannel, setCurrentChannel] = useState<Channel | null>(null);

  const [restoredMedia] = useState<PlayableMedia | null>(initialMedia.restoredMedia);
  const pendingMediaRef = useRef<PendingMedia>(initialMedia.pending);

  const [followedPrograms, setFollowedPrograms] = useState<string[]>(() => readStoredIdList("followedPrograms"));
  const [followedChannels, setFollowedChannels] = useState<string[]>(() => readStoredIdList("followedChannels"));

  const [episodeDB, setEpisodeDB] = useState<EpisodeDB>({});
  const [channelDB, setChannelDB] = useState<ChannelDB>({});
  const [programDB, setProgramDB] = useState<ProgramDB>({});

  const [progressDB, setProgressDB] = useState<ProgressDB>(() => readStoredProgress());
  const updateEpisodeProgress = (episodeID: Episode["id"], elapsed: Seconds | number) => {
    setProgressDB((prev) => ({
      ...prev,
      [episodeID]: typeof elapsed === "number" ? new Seconds(elapsed) : elapsed,
    }));
  };

  const resolvePendingEpisode = useCallback((episode: EpisodeWithProgram) => {
    const pending = pendingMediaRef.current;
    if (!pending || pending.type !== "episode" || pending.id !== episode.id) return;
    setCurrentChannel(null);
    setCurrentEpisode(episode);
    setCurrentStreamUrl(episode.external_audio_url);
    pendingMediaRef.current = null;
  }, []);

  const resolvePendingChannel = useCallback((channel: Channel) => {
    const pending = pendingMediaRef.current;
    if (!pending || pending.type !== "channel" || pending.id !== channel.id) return;
    setCurrentEpisode(null);
    setCurrentChannel(channel);
    setCurrentStreamUrl(channel.external_audio_url);
    pendingMediaRef.current = null;
  }, []);

  const registerEpisode = useCallback((episode: EpisodeWithProgram) => {
    setEpisodeDB((prev) => (prev[episode.id] ? prev : { ...prev, [episode.id]: episode }));
    resolvePendingEpisode(episode);
  }, [resolvePendingEpisode]);

  const registerChannel = useCallback((channel: Channel) => {
    setChannelDB((prev) => (prev[channel.id] ? prev : { ...prev, [channel.id]: channel }));
    resolvePendingChannel(channel);
  }, [resolvePendingChannel]);

  const registerProgram = useCallback((program: Program) => {
    setProgramDB((prev) => (prev[program.id] ? prev : { ...prev, [program.id]: program }));
  }, []);

  const sortedEpisodes = useMemo(() => {
    return Object.values(episodeDB)
      .filter((episode): episode is EpisodeWithProgram => Boolean(episode?.publish_date))
      .sort((a, b) => new Date(b.publish_date).getTime() - new Date(a.publish_date).getTime());
  }, [episodeDB]);

  const currentProgress = useMemo(() => {
    if (currentEpisode) {
      return progressDB[currentEpisode.id] || Seconds.from(0);
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
    if (!episode) {
      console.warn(`Episode with ID ${episodeId} not found in episodeDB.`);
      return;
    }

    setCurrentChannel(null);
    setCurrentEpisode(episode);
    setCurrentStreamUrl(episode.external_audio_url);
    pendingMediaRef.current = null;

    setIsPlaying(true);
    setTimeout(() => {
      // I don't like this but it's to jostle the audio player into playing
      setIsPlaying(true);
    }, 50);
  }, [episodeDB]);

  const playChannel = useCallback((channelId: Channel["id"]) => {
    const channel = channelDB[channelId];
    if (!channel) {
      console.warn(`Channel with ID ${channelId} not found in channelDB.`);
      return;
    }

    setCurrentEpisode(null);
    setCurrentChannel(channel);
    setCurrentStreamUrl(channel.external_audio_url);
    setIsPlaying(true);
    pendingMediaRef.current = null;
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
        >= nextEpisodeCandidate.duration
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
        >= prevEpisodeCandidate.duration
      ) continue; // Already fully listened to

      // Found the previous unlistened episode
      playEpisode(prevEpisodeCandidate.id);
      break;
    }
  };

  // Restore current episode/channel on mount
  const hasInitializedPlaybackRef = useRef(false);
  useEffect(() => {
    if (currentEpisode || currentChannel) {
      hasInitializedPlaybackRef.current = true;
    }
  }, [currentEpisode, currentChannel]);

  // Save currently playing episode to localStorage on change
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (currentEpisode) {
      localStorage.setItem("currentEpisodeID", currentEpisode.id);
    }
    else {
      if (!hasInitializedPlaybackRef.current) return;
      localStorage.removeItem("currentEpisodeID");
    }
  }, [currentEpisode]);

  // Save currently playing channel to localStorage on change
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (currentChannel) {
      localStorage.setItem("currentChannelID", currentChannel.id);
    }
    else {
      if (!hasInitializedPlaybackRef.current) return;
      localStorage.removeItem("currentChannelID");
    }
  }, [currentChannel]);

  const currentMedia = useMemo<PlayableMedia | null>(() => {
    if (currentEpisode) {
      return {
        type: "episode",
        id: currentEpisode.id,
        url: currentEpisode.external_audio_url,
        title: currentEpisode.title,
        subtitle: currentEpisode.program?.name ?? null,
        image: currentEpisode.image_square_url ?? null,
      };
    }
    if (currentChannel) {
      return {
        type: "channel",
        id: currentChannel.id,
        url: currentChannel.external_audio_url,
        title: currentChannel.name,
        subtitle: currentChannel.channel_type,
        image: currentChannel.image_square_url,
      };
    }
    return restoredMedia;
  }, [currentChannel, currentEpisode, restoredMedia]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!currentMedia) {
      localStorage.removeItem("currentMedia");
      return;
    }
    localStorage.setItem("currentMedia", JSON.stringify(currentMedia));
  }, [currentMedia]);

  // currentStreamUrl is initialized from restored media if available.

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem("followedPrograms", JSON.stringify(followedPrograms));
  }, [followedPrograms]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem("followedChannels", JSON.stringify(followedChannels));
  }, [followedChannels]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const serialized = Object.fromEntries(
      Object.entries(progressDB).map(([id, seconds]) => [id, seconds.toNumber()])
    );
    localStorage.setItem("progressDB", JSON.stringify(serialized));
  }, [progressDB]);

  const hasLoadedRemoteRef = useRef(false);
  const pendingSyncRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) {
      hasLoadedRemoteRef.current = false;
      return;
    }

    let isActive = true;
    const loadRemoteState = async () => {
      try {
        const response = await fetch("/api/user-state");
        if (!response.ok) return;
        const data = (await response.json()) as RemoteUserState;
        if (!isActive) return;

        const remoteProgress = normalizeProgressPayload(data.progress);
        setProgressDB((prev) => mergeProgress(prev, remoteProgress));

        if (data.followedPrograms?.length) {
          setFollowedPrograms((prev) => Array.from(new Set([...prev, ...data.followedPrograms!])));
        }
        if (data.followedChannels?.length) {
          setFollowedChannels((prev) => Array.from(new Set([...prev, ...data.followedChannels!])));
        }
      }
      finally {
        if (isActive) {
          hasLoadedRemoteRef.current = true;
        }
      }
    };

    void loadRemoteState();
    return () => {
      isActive = false;
    };
  }, [isLoaded, isSignedIn]);

  const syncPayload = useMemo(() => {
    return {
      progress: serializeProgressDB(progressDB),
      followedPrograms,
      followedChannels,
    } as RemoteUserState;
  }, [progressDB, followedPrograms, followedChannels]);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    if (!hasLoadedRemoteRef.current) return;

    if (pendingSyncRef.current) {
      window.clearTimeout(pendingSyncRef.current);
    }

    pendingSyncRef.current = window.setTimeout(() => {
      void fetch("/api/user-state", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(syncPayload),
      });
    }, 800);

    return () => {
      if (pendingSyncRef.current) {
        window.clearTimeout(pendingSyncRef.current);
      }
    };
  }, [isLoaded, isSignedIn, syncPayload]);

  return (
    <PlayContext.Provider
      value={{
        isPlaying,
        play: () => setIsPlaying(true),
        pause: () => setIsPlaying(false),
        currentStreamUrl,
        currentMedia,
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
        registerEpisode,
        episodeDB,
        isFetchingEpisodes,
        channelDB,
        isFetchingChannels,
        followedPrograms,
        setFollowedPrograms,
        followedChannels,
        setFollowedChannels,
        playChannel,
        registerChannel,
        isFetchingPrograms,
        programDB,
        registerProgram,
        playNextEpisode,
        playPreviousEpisode,
      }}
    >
      {children}
    </PlayContext.Provider>
  );
}
