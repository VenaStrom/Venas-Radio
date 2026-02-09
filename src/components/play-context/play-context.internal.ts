import { Channel, ChannelDB, Episode, EpisodeDB, EpisodeWithProgram, PlayableMedia, Program, ProgramDB, ProgressDB, Seconds } from "@/types/types";
import { createContext } from "react";

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
  setFollowedPrograms: React.Dispatch<React.SetStateAction<string[]>>;

  followedChannels: string[];
  setFollowedChannels: React.Dispatch<React.SetStateAction<string[]>>;

  registerProgram: (program: Program) => void;

  playNextEpisode: () => void;
  playPreviousEpisode: () => void;
};

export const PlayContext = createContext<PlayContextType | undefined>(undefined);
