import "./global.scss";
import { Inter } from "next/font/google";
import type { Metadata } from "next";
import * as Icon from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
    title: "VR Radiospelare",
    description: "En radiospelare gjord av och för Viggo.",
    icons: {
        icon: "/icons/audio-lines.svg",
    }
};

const interFont = Inter({
    subsets: ["latin"],
})

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="sv" className={interFont.className}>
            <body className="bg-zinc-900 text-zinc-100">

                <header className="bg-zinc-950 p-2 flex flex-row items-center justify-between">
                    <div className="flex flex-row items-center justify-center gap-2">
                        <Icon.AudioLines />
                        <p className="font-bold text-lg">VR</p>
                    </div>

                    <Icon.Settings />
                </header>

                {children}

                <footer className="pb-4 bg-zinc-950 flex flex-col self-end items-center gap-y-3">

                    {/* Progress bar */}
                    <div id="progress-bar" className="h-1 w-full bg-zinc-800 flex flex-col justify-start items-start">
                        <div id="progress-bar-fill" className="h-full bg-zinc-100 w-[50%] rounded-e-sm"></div>
                    </div>

                    {/* Controls */}
                    <div id="player" className="flex flex-col items-center w-full px-5">

                        {/*
                        <button>
                            <Icon.SkipBack size={30} />
                        </button>
                        */}

                        <button className="self-end">
                            <Icon.Play size={30} className="fill-zinc-100" />
                            {/* <Icon.Pause size={30} /> */}
                        </button>

                        {/*
                        <button>
                            <Icon.SkipForward size={30} />
                        </button>
                        */}
                    </div>

                    {/* Navigation Buttons */}
                    <nav className="w-2/3 flex flex-row justify-between items-center">
                        <Link href={"/"}>
                            <Icon.Home size={50} />
                        </Link>

                        <Link href={"/"}>
                            <Icon.Search size={50} />
                        </Link>

                        <Link href={"/feed"}>
                            <Icon.Heart size={50} />
                        </Link>
                    </nav>
                </footer>
            </body>
        </html>
    );
}