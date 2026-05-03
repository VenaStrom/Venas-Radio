import { defaultPlayContext, PlayContext } from "@/app/context/play-context";

export function PlayContextProvider({ children }: { children: React.ReactNode }) {
  return (
    <PlayContext.Provider value={{
      ...defaultPlayContext,
    }}>
      {children}
    </PlayContext.Provider>
  );
}