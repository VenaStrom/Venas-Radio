"use client";

import { AudioPlayerPacket } from "@/types";
import { createContext, useContext, useState } from "react";

// Check localstorage for audio packet
const isServer = typeof window === "undefined";
const savedPacket = !isServer ? localStorage.getItem("audioPacket") : null;
const initialPacket: AudioPlayerPacket | null = savedPacket ? JSON.parse(savedPacket) : null;

export const AudioPacketContext = createContext<AudioPlayerPacket | null>(initialPacket);
export const AudioPacketSetterContext = createContext<React.Dispatch<React.SetStateAction<AudioPlayerPacket | null>>>(() => { });

export function useAudioContext() {
  const audioPacket = useContext(AudioPacketContext);
  const setAudioPacket = useContext(AudioPacketSetterContext);

  return { audioPacket, setAudioPacket };
}

export function AudioContextProvider({ children }: { children: React.ReactNode }) {
  const [packet, setPacket] = useState<AudioPlayerPacket | null>(null);
  return (
    <AudioPacketContext.Provider value={packet}>
      <AudioPacketSetterContext.Provider value={setPacket}>
        {children}
      </AudioPacketSetterContext.Provider>
    </AudioPacketContext.Provider>
  );
}