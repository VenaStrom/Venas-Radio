"use client";

import { useSettingsStore } from "@/store/settings-store";
import { HeartIcon } from "lucide-react";
import { CSSProperties, useState } from "react";

export default function LikeButton({
  programID,
  channelID,
  className = "",
  style,
}: {
  programID?: number;
  channelID?: number;
  className?: string;
  style?: CSSProperties;
}
) {
  const [liked, setLiked] = useState(false);
  const settingsStore = useSettingsStore();

  const id = programID || channelID || 0;

  // Load state
  useState(() => {
    if (channelID) {
      setLiked(settingsStore.settings.likedChannels?.includes(id) || false);
    }
    else if (programID) {
      setLiked(settingsStore.settings.programIDs.includes(id));
    }
    else {
      setLiked(false);
    }
  });

  // Save state
  const toggleLike = () => {
    const newState = !liked;

    setLiked(newState);

    // If likedChannels isn't defined, set it to an empty array
    if (!settingsStore.settings?.likedChannels) {
      settingsStore.setSetting("likedChannels", []);
    }

    if (newState) {
      if (channelID) {
        settingsStore.setSetting("likedChannels", Array.from(new Set([...settingsStore.settings.likedChannels, id])));
      }
      else if (programID) {
        settingsStore.setSetting("programIDs", Array.from(new Set([...settingsStore.settings.programIDs, id])));
      }
    }
    else {
      if (channelID) {
        settingsStore.setSetting("likedChannels", settingsStore.settings.likedChannels.filter(cid => cid !== id));
      }
      else if (programID) {
        settingsStore.setSetting("programIDs", settingsStore.settings.programIDs.filter(pid => pid !== id));
      }
    }
  };

  return (
    <button className={`size-min ${className || ""}`} style={style}>
      <HeartIcon
        className={liked ? "fill-[red] !text-[red]" : "none"}
        size={28}
        onClick={toggleLike}
      />
    </button>
  );
}