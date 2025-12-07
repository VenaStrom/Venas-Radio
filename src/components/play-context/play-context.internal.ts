import { Channel, ChannelDB, Episode, EpisodeDB, ProgramDB, ProgressDB } from "@/types/types";
import { createContext } from "react";

export type PlayContextType = {
  isPlaying: boolean;
  play: () => void;
  pause: () => void;

  currentStreamUrl: string | null;
  setCurrentStreamUrl: (url: string) => void;

  /** Number if there's a current episode or null if not and infinity if streaming  */
  currentProgress: number | null;
  setCurrentProgress: (progress: number) => void;

  currentEpisode: Episode | null;
  setCurrentEpisode: (episode: Episode | null) => void;
  playEpisode: (episodeId: Episode["id"]) => void;

  progressDB: ProgressDB;
  updateEpisodeProgress: (episodeId: Episode["id"], progress: number) => void;

  episodeDB: EpisodeDB;
  isFetchingEpisodes: boolean;

  channelDB: ChannelDB;
  isFetchingChannels: boolean;

  programDB: ProgramDB;
  isFetchingPrograms: boolean;

  currentChannel: Channel | null;
  setCurrentChannel: (channel: Channel | null) => void;
  playChannel: (channelId: Channel["id"]) => void;

  followedPrograms: number[];
  setFollowedPrograms: React.Dispatch<React.SetStateAction<number[]>>;

  followedChannels: number[];
  setFollowedChannels: React.Dispatch<React.SetStateAction<number[]>>;
};

export const PlayContext = createContext<PlayContextType | undefined>(undefined);
