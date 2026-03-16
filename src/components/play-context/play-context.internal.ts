import { Channel, ChannelDB, Episode, EpisodeDB, EpisodeWithProgram, PlayableMedia, Program, ProgramDB, ProgressDB, Seconds, StreamEpisodeInfo } from "@/types/types";
import { createContext, Dispatch, SetStateAction } from "react";

export type PlayContextType = {
  isPlaying: boolean;
  play: () => void;
  pause: () => void;

  currentStreamUrl: string | null;
  setCurrentStreamUrl: (url: string | null) => void;

  currentMedia: PlayableMedia | null;

  /** Seconds if there's a current episode; null if not. */
  currentProgress: Seconds | null;
  setCurrentProgress: (elapsed: Seconds) => void;

  currentEpisode: EpisodeWithProgram | null;
  setCurrentEpisode: (episode: EpisodeWithProgram | null) => void;
  playEpisode: (episodeId: Episode["id"]) => void;
  registerEpisode: (episode: EpisodeWithProgram) => void;

  progressDB: ProgressDB;
  updateEpisodeProgress: (episodeId: Episode["id"], elapsed: Seconds) => void;

  episodeDB: EpisodeDB;
  isFetchingEpisodes: boolean;

  channelDB: ChannelDB;
  isFetchingChannels: boolean;

  programDB: ProgramDB;
  isFetchingPrograms: boolean;

  currentChannel: Channel | null;
  setCurrentChannel: (channel: Channel | null) => void;
  playChannel: (channelId: Channel["id"]) => void;
  registerChannel: (channel: Channel) => void;

  followedPrograms: string[];
  setFollowedPrograms: Dispatch<SetStateAction<string[]>>;

  followedChannels: string[];
  setFollowedChannels: Dispatch<SetStateAction<string[]>>;

  registerProgram: (program: Program) => void;

  playNextEpisode: () => void;
  playPreviousEpisode: () => void;

  /** Bumps when remote progress is loaded so consumers can re-apply seek. */
  remoteProgressVersion: number;

  /**
   * Time-ordered map of episodes in the current continuous stream.
   * Null when playing a channel or no stream is active.
   */
  streamEpisodeMap: StreamEpisodeInfo[] | null;

  /**
   * Registered by audio-player so context functions (prev/next) can seek the
   * underlying <audio> element without having to own a ref to it.
   */
  registerStreamSeek: (fn: ((time: number) => void) | null) => void;

  /**
   * Called by audio-player's timeupdate handler with the raw stream time.
   * Updates currentEpisode when a boundary has been crossed.
   */
  advanceToEpisodeInStream: (streamTime: number) => void;
};

export const PlayContext = createContext<PlayContextType | undefined>(undefined);
