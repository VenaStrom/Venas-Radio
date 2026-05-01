import { AudioLinesIcon, HeartIcon, MenuIcon, NewspaperIcon, RadioIcon } from "@/app/components/icons";
import "./global.tw.css";
import type React from "react";

export function App(): React.ReactNode {
  return (<>
    <header className="flex flex-row items-center px-2 py-2 bg-zinc-950">
      {/* Logo */}
      <div className="flex flex-row items-center gap-1 select-none">
        <AudioLinesIcon className="size-6" />
        <p className="font-bold text-lg">VR</p>
      </div>

      {/* Spacer */}
      <span className="flex-1"></span>

      {/* Options */}
      <MenuIcon className="size-10 me-2" />
    </header>

    <main>APP</main>

    {/* Navigation Buttons */}
    <footer className="bg-zinc-950 pb-8">
      {/* Audio controls */}
      <div>
        CONTROLS
      </div>

      <nav className="flex flex-row justify-between items-center px-13">
        <a href={"/"}>
          <RadioIcon className="size-12" />
        </a>

        <a href={"/search"}>
          <NewspaperIcon className="size-12" />
        </a>

        <a href={"/feed"}>
          <HeartIcon className="size-12" />
        </a>
      </nav>
    </footer>
  </>
  );
}