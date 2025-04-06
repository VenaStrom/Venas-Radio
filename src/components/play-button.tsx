"use client";

import { Button } from "@shadcn/button";
import * as Icon from "lucide-react";
import { MouseEventHandler, useState } from "react";

export function PlayButton(
  {
    onClick = () => { },
    className = "",
    state = "paused"
  }: {
    onClick?: MouseEventHandler<HTMLButtonElement>,
    className?: string,
    state?: "playing" | "paused"
  }) {

  return (
    <Button onClick={onClick} variant={"link"} className={`!p-0 !m-1 size-6 hover:fill-zinc-100/50 ${className}`}>
      {state === "playing" ?
        <Icon.Pause className="fill-zinc-100 size-full" />
        :
        <Icon.Play className="fill-zinc-100 size-full" />
      }
    </Button>
  );
}