import { ChannelDB, Episode, EpisodeDB } from "@/types/types";
import { createContext } from "react";

export type PlayContextType = {
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

  episodeDB: EpisodeDB;
  isFetchingEpisodes: boolean;

  channelDB: ChannelDB;
  isFetchingChannels: boolean;

  followedPrograms: number[];
  setFollowedPrograms: React.Dispatch<React.SetStateAction<number[]>>;
  followedChannels: number[];
  setFollowedChannels: React.Dispatch<React.SetStateAction<number[]>>;
};

export const PlayContext = createContext<PlayContextType | undefined>(undefined);
