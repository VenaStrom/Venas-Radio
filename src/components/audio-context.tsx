"use client";

import { AudioPlayerPacket } from "@/types";
import { createContext, useContext, useState } from "react";

const nullPacket: AudioPlayerPacket = {
  url: null,
  image: null,
  superTitle: null,
  title: "Spelar inget",
  subtitle: "Hitta ett avsnitt eller en kanal att lyssna på.",
  duration: 0,
  progress: 0,
};

// Check localstorage for audio packet
const savedPacket = typeof window !== "undefined" && localStorage.getItem("audioPacket");
const initialPacket: AudioPlayerPacket = savedPacket ? JSON.parse(savedPacket) : nullPacket;

export const AudioPacketContext = createContext<AudioPlayerPacket>(initialPacket);
export const AudioPacketSetterContext = createContext<React.Dispatch<React.SetStateAction<AudioPlayerPacket>>>(() => { });

export function useAudioContext() {
  const audioPacket = useContext(AudioPacketContext);
  const setAudioPacket = useContext(AudioPacketSetterContext);

  return { audioPacket, setAudioPacket };
}

export function AudioContextProvider({ children }: { children: React.ReactNode }) {
  const [packet, setPacket] = useState<AudioPlayerPacket>(initialPacket);
  return (
    <AudioPacketContext.Provider value={packet}>
      <AudioPacketSetterContext.Provider value={setPacket}>
        {children}
      </AudioPacketSetterContext.Provider>
    </AudioPacketContext.Provider>
  );
}