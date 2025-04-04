"use client";

import { Episode } from "@/types";
import { Button } from "@shadcn/button";
import * as Icon from "lucide-react";
import { useState } from "react";

export function PlayButton({ episode }: { episode: Episode }) {
  const [buttonState, setButtonState] = useState<"playing" | "paused">("paused");

  return (
    <Button variant={"link"} className="!p-0 !m-1 size-5 hover:fill-zinc-100/50">
      {buttonState === "paused" ?
        <Icon.Play className="fill-zinc-100 size-full" />
        :
        <Icon.Pause className="fill-zinc-100 size-full" />
      }
    </Button>
  );
}