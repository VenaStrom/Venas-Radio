"use client";

import type { Channel, ChannelDB, Episode, EpisodeDB, EpisodeWithProgram, PlayableMedia, Program, ProgramDB, ProgressDB, StreamEpisodeInfo } from "@/types/types";
import { Seconds } from "@/types/types";
import { useState, ReactNode, useEffect, useMemo, useRef, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import { PlayContext } from "@/components/play-context/play-context.internal";
import { progressDBDeserializer } from "@/components/deserializer/progress-deserializer";
import { getContinuousStreamUrl, getEpisodeAudioUrl } from "@/lib/episode-audio";

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
  return { ...local, ...remote };
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

/** Build an ordered episode queue starting from startId.
 *  The start episode is always included; subsequent ones skip fully-listened episodes.
 *  Capped at MAX_STREAM_EPISODES to keep server-side startup fast. */
const MAX_STREAM_EPISODES = 20;

function buildStreamQueue(
  sortedEpisodes: EpisodeWithProgram[],
  startId: string,
  progressDB: ProgressDB,
): EpisodeWithProgram[] {
  const startIndex = sortedEpisodes.findIndex((ep) => ep.id === startId);
  if (startIndex === -1) return [];
  const startEp = sortedEpisodes[startIndex];
  if (!startEp) return [];
  const rest = sortedEpisodes.slice(startIndex + 1).filter((ep) => {
    return (progressDB[ep.id]?.toNumber() ?? 0) < ep.duration;
  });
  return [startEp, ...rest].slice(0, MAX_STREAM_EPISODES);
}

/** Build time-offset map for a queue of episodes. */
function buildStreamEpisodeMap(episodes: EpisodeWithProgram[]): StreamEpisodeInfo[] {
  let t = 0;
  return episodes.map((ep) => {
    const info: StreamEpisodeInfo = { id: ep.id, startTime: t, duration: ep.duration };
    t += ep.duration;
    return info;
  });
}

const likedIdsCookieLimit = 50;

function writeLikedProgramsCookie(programIds: string[]) {
  if (typeof document === "undefined") return;
  const trimmed = programIds.map((id) => id.trim()).filter(Boolean).slice(0, likedIdsCookieLimit);
  const encoded = encodeURIComponent(JSON.stringify(trimmed));
  const maxAgeSeconds = 60 * 60 * 24 * 30;
  document.cookie = `likedPrograms=${encoded}; path=/; max-age=${maxAgeSeconds}; samesite=lax`;
}

function writeLikedChannelsCookie(channelIds: string[]) {
  if (typeof document === "undefined") return;
  const trimmed = channelIds.map((id) => id.trim()).filter(Boolean).slice(0, likedIdsCookieLimit);
  const encoded = encodeURIComponent(JSON.stringify(trimmed));
  const maxAgeSeconds = 60 * 60 * 24 * 30;
  document.cookie = `likedChannels=${encoded}; path=/; max-age=${maxAgeSeconds}; samesite=lax`;
}

export function PlayProvider({
  children,
  initialFollowedPrograms = [],
  initialFollowedChannels = [],
}: {
  children: ReactNode;
  initialFollowedPrograms?: string[];
  initialFollowedChannels?: string[];
}) {
  const { isLoaded, isSignedIn } = useUser();
  const [isFetchingEpisodes, _setIsFetchingEpisodes] = useState(true);
  const [isFetchingChannels, _setIsFetchingChannels] = useState(true);
  const [isFetchingPrograms, _setIsFetchingPrograms] = useState(true);

  const [isPlaying, setIsPlaying] = useState(false);

  const initialMedia = useMemo(() => readStoredMedia(), []);
  const [currentStreamUrl, setCurrentStreamUrl] = useState<string | null>(() => {
    if (initialMedia.restoredMedia?.type === "episode" && initialMedia.restoredMedia.id) {
      return getEpisodeAudioUrl(initialMedia.restoredMedia.id);
    }
    return initialMedia.restoredMedia?.url ?? null;
  });

  const [currentEpisode, setCurrentEpisode] = useState<EpisodeWithProgram | null>(null);
  const [currentChannel, setCurrentChannel] = useState<Channel | null>(null);

  const [restoredMedia] = useState<PlayableMedia | null>(initialMedia.restoredMedia);
  const pendingMediaRef = useRef<PendingMedia>(initialMedia.pending);

  const [followedPrograms, setFollowedPrograms] = useState<string[]>(initialFollowedPrograms);
  const [followedChannels, setFollowedChannels] = useState<string[]>(initialFollowedChannels);

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

  // Stream state
  const [streamEpisodeMap, setStreamEpisodeMap] = useState<StreamEpisodeInfo[] | null>(null);
  const [seekTrigger, setSeekTrigger] = useState(0);
  // Ref holding a seek function registered by the audio-player
  const seekInStreamRef = useRef<((time: number) => void) | null>(null);
  const registerStreamSeek = useCallback((fn: ((time: number) => void) | null) => {
    seekInStreamRef.current = fn;
  }, []);

  const sortedEpisodes = useMemo(() => {
    return Object.values(episodeDB)
      .filter((episode): episode is EpisodeWithProgram => Boolean(episode?.publish_date))
      .sort((a, b) => new Date(b.publish_date).getTime() - new Date(a.publish_date).getTime());
  }, [episodeDB]);

  const resolvePendingEpisode = useCallback((episode: EpisodeWithProgram) => {
    const pending = pendingMediaRef.current;
    if (!pending || pending.type !== "episode" || pending.id !== episode.id) return;
    setCurrentChannel(null);
    setCurrentEpisode(episode);
    // Use single-episode URL initially; upgrade effect will switch to stream once
    // sortedEpisodes contains this episode.
    setCurrentStreamUrl(getEpisodeAudioUrl(episode.id));
    setStreamEpisodeMap(null);
    setSeekTrigger((t) => t + 1);
    pendingMediaRef.current = null;
  }, []);

  const resolvePendingChannel = useCallback((channel: Channel) => {
    const pending = pendingMediaRef.current;
    if (!pending || pending.type !== "channel" || pending.id !== channel.id) return;
    setCurrentEpisode(null);
    setCurrentChannel(channel);
    setCurrentStreamUrl(channel.external_audio_url);
    setStreamEpisodeMap(null);
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
    pendingMediaRef.current = null;

    const queue = buildStreamQueue(sortedEpisodes, episodeId, progressDB);
    if (queue.length > 0) {
      const map = buildStreamEpisodeMap(queue);
      setStreamEpisodeMap(map);
      setCurrentStreamUrl(getContinuousStreamUrl(queue.map((ep) => ep.id)));
    }
    else {
      // Episode is fully listened — restart from beginning as single
      setStreamEpisodeMap(null);
      setCurrentStreamUrl(getEpisodeAudioUrl(episode.id));
    }
    setSeekTrigger((t) => t + 1);

    setIsPlaying(true);
    setTimeout(() => {
      // I don't like this but it's to jostle the audio player into playing
      setIsPlaying(true);
    }, 50);
  }, [episodeDB, sortedEpisodes, progressDB]);

  const playChannel = useCallback((channelId: Channel["id"]) => {
    const channel = channelDB[channelId];
    if (!channel) {
      console.warn(`Channel with ID ${channelId} not found in channelDB.`);
      return;
    }

    setCurrentEpisode(null);
    setCurrentChannel(channel);
    setCurrentStreamUrl(channel.external_audio_url);
    setStreamEpisodeMap(null);
    setIsPlaying(true);
    pendingMediaRef.current = null;
  }, [channelDB]);

  const playNextEpisode = useCallback(() => {
    if (!currentEpisode) return;

    if (streamEpisodeMap) {
      // Seek within the existing stream
      const currentIdx = streamEpisodeMap.findIndex((e) => e.id === currentEpisode.id);
      if (currentIdx === -1 || currentIdx >= streamEpisodeMap.length - 1) return;
      const next = streamEpisodeMap[currentIdx + 1];
      const nextEpisode = episodeDB[next.id];
      if (!nextEpisode) return;
      setCurrentEpisode(nextEpisode);
      seekInStreamRef.current?.(next.startTime);
      return;
    }

    // Fallback: no stream, rebuild from next episode
    const currentIndex = sortedEpisodes.findIndex(ep => ep.id === currentEpisode.id);
    if (currentIndex === -1) return;
    for (let i = currentIndex + 1; i < sortedEpisodes.length; i++) {
      const candidate = sortedEpisodes[i];
      if (!candidate) continue;
      if ((progressDB[candidate.id]?.toNumber() ?? 0) >= candidate.duration) continue;
      playEpisode(candidate.id);
      break;
    }
  }, [currentEpisode, streamEpisodeMap, episodeDB, sortedEpisodes, progressDB, playEpisode]);

  const playPreviousEpisode = useCallback(() => {
    if (!currentEpisode) return;

    if (streamEpisodeMap) {
      const currentIdx = streamEpisodeMap.findIndex((e) => e.id === currentEpisode.id);
      if (currentIdx <= 0) return;
      const prev = streamEpisodeMap[currentIdx - 1];
      const prevEpisode = episodeDB[prev.id];
      if (!prevEpisode) return;
      setCurrentEpisode(prevEpisode);
      seekInStreamRef.current?.(prev.startTime);
      return;
    }

    // Fallback: no stream
    const currentIndex = sortedEpisodes.findIndex(ep => ep.id === currentEpisode.id);
    if (currentIndex === -1) return;
    for (let i = currentIndex - 1; i >= 0; i--) {
      const candidate = sortedEpisodes[i];
      if (!candidate) continue;
      if ((progressDB[candidate.id]?.toNumber() ?? 0) >= candidate.duration) continue;
      playEpisode(candidate.id);
      break;
    }
  }, [currentEpisode, streamEpisodeMap, episodeDB, sortedEpisodes, progressDB, playEpisode]);

  /**
   * Called by audio-player's timeupdate handler to advance currentEpisode when
   * the stream crosses an episode boundary.
   */
  const advanceToEpisodeInStream = useCallback((streamTime: number) => {
    if (!streamEpisodeMap) return;
    const info = streamEpisodeMap.find(
      (e) => streamTime >= e.startTime && streamTime < e.startTime + e.duration,
    );
    if (!info) return;
    const episode = episodeDB[info.id];
    if (!episode) return;
    setCurrentEpisode((prev) => (prev?.id === episode.id ? prev : episode));
  }, [streamEpisodeMap, episodeDB]);

  // Upgrade single-episode URL to continuous stream once sortedEpisodes is populated.
  // This handles the restore-from-localStorage case without requiring a user action.
  useEffect(() => {
    if (!currentEpisode) return;
    if (streamEpisodeMap !== null) return; // Already on a stream
    const inSorted = sortedEpisodes.some((ep) => ep.id === currentEpisode.id);
    if (!inSorted) return;

    const queue = buildStreamQueue(sortedEpisodes, currentEpisode.id, progressDB);
    if (queue.length === 0) return;

    const map = buildStreamEpisodeMap(queue);
    setStreamEpisodeMap(map);
    setCurrentStreamUrl(getContinuousStreamUrl(queue.map((ep) => ep.id)));
    setSeekTrigger((t) => t + 1); // preserve playback position through the upgrade
  // Only react to sortedEpisodes changes (or first time currentEpisode is set)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortedEpisodes, currentEpisode]);

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
        url: getEpisodeAudioUrl(currentEpisode.id),
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
    const storedPrograms = readStoredIdList("followedPrograms");
    const storedChannels = readStoredIdList("followedChannels");
    if (storedPrograms.length > 0) {
      setFollowedPrograms((prev) => Array.from(new Set([...prev, ...storedPrograms])));
    }
    if (storedChannels.length > 0) {
      setFollowedChannels((prev) => Array.from(new Set([...prev, ...storedChannels])));
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem("followedPrograms", JSON.stringify(followedPrograms));
    writeLikedProgramsCookie(followedPrograms);
  }, [followedPrograms]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem("followedChannels", JSON.stringify(followedChannels));
    writeLikedChannelsCookie(followedChannels);
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
  const [remoteProgressVersion, setRemoteProgressVersion] = useState(0);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) {
      hasLoadedRemoteRef.current = false;
      setRemoteProgressVersion(0);
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
        setRemoteProgressVersion((prev) => prev + 1);

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
        remoteProgressVersion,
        seekTrigger,
        streamEpisodeMap,
        registerStreamSeek,
        advanceToEpisodeInStream,
      }}
    >
      {children}
    </PlayContext.Provider>
  );
}
