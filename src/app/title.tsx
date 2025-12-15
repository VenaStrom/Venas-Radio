"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AudioLinesIcon } from "lucide-react";
import { useMemo, useState } from "react";

export function Title() {
  const [clickCount, setClickCount] = useState(0);
  const isOpen = useMemo(() => clickCount >= 5, [clickCount]);

  return (<>
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (open) setClickCount((count) => count + 1);
      else setClickCount(0);
    }}>
      <DialogTrigger>
        <div
          className="flex flex-row items-center justify-center gap-1 select-none"
        >
          <AudioLinesIcon />
          <p className="font-bold text-lg">VR</p>
        </div>
      </DialogTrigger>

      <DialogContent className="max-w-4/5 rounded-md" lang="en">
        <DialogTitle>Debug Options</DialogTitle>

        <Button
          variant={"outline"}
          onClick={(e) => {
            e.preventDefault();
            alert("Dumped local storage to clipboard");
            navigator.clipboard.writeText(JSON.stringify({
              followedPrograms: localStorage.getItem("followedPrograms"),
              followedChannels: localStorage.getItem("followedChannels"),
              progressDB: localStorage.getItem("progressDB"),
              programDB: sessionStorage.getItem("programDB"),
              channelDB: sessionStorage.getItem("channelDB"),
              episodeDB: sessionStorage.getItem("episodeDB"),
              "legacy-zustand-migrated": localStorage.getItem("legacy-zustand-migrated"),
            }));
          }}
        >
          Dump local storage to clipboard
        </Button>

        <Button
          variant={"outline"}
          className="cursor-pointer"
          onClick={(e) => {
            e.preventDefault();
            localStorage.removeItem("legacy-zustand-migrated");
            alert("Removed 'legacy-zustand-migrated' flag from local storage. The migration will be redone on next load.");
            window.location.reload();
          }}
        >
          Redo zustand migration
        </Button>
      </DialogContent>
    </Dialog>
  </>);
}