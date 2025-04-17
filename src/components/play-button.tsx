"use client";

import { Button } from "@shadcn/button";
import * as Icon from "lucide-react";
import { ButtonHTMLAttributes } from "react";

export interface PlayButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  className?: string;
  isPlaying?: boolean;
}

export function PlayButton({
  className = "",
  isPlaying = false,
  ...props
}: PlayButtonProps) {

  return (
    <Button {...props} variant={"link"} className={`!p-0 !m-1 size-6 hover:fill-zinc-100/50 ${className}`}>
      {isPlaying ?
        <Icon.Pause className="fill-zinc-100 size-full" />
        :
        <Icon.Play className="fill-zinc-100 size-full" />
      }
    </Button>
  );
}