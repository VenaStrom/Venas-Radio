import "./global.scss";
import { Nunito_Sans } from "next/font/google";
import type { Metadata } from "next";
import * as Icon from "lucide-react";
import Link from "next/link";
import AudioControls from "@/components/audio-player";
import SettingsMenu from "@/components/settings-menu";

export const metadata: Metadata = {
    title: "VR Radiospelare",
    description: "En radiospelare gjord av och för Viggo.",
    icons: {
        icon: "/icons/audio-lines.svg",
    },
    openGraph: {
        type: "music.radio_station",
        title: "VR Radiospelare",
        siteName: "VR Radiospelare",
        locale: "sv_SE",
        url: "https://vr-radio.tailad6f63.ts.net/",
        images: [
            {
                url: "https://raw.githubusercontent.com/viggoStrom/Viggos-Radio/refs/heads/main/public/icons/audio-lines.svg",
                secureUrl: "https://raw.githubusercontent.com/viggoStrom/Viggos-Radio/refs/heads/main/public/icons/audio-lines.svg",
            },
        ],
    },
    creator: "Viggo Ström <ViggoStrom05+vr@gmail.com>",
    keywords: ["radio", "radiospelare", "audio", "ljud", "musik", "podcast", "streaming"],
    category: "Music",
    robots: "index, follow",
};

const nunitoSansFont = Nunito_Sans({
    subsets: ["latin"]
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="sv" className={nunitoSansFont.className}>
            <body className="bg-zinc-900 text-zinc-100">

                <header className="bg-zinc-950 p-2 flex flex-row items-center justify-between">
                    <div className="flex flex-row items-center justify-center gap-1">
                        <Icon.AudioLines />
                        <p className="font-bold text-lg">VR</p>
                    </div>

                    <SettingsMenu />
                </header>

                {children}

                <footer className="pb-4 bg-zinc-950 flex flex-col self-end items-center gap-y-3">
                    {/* Audio Controls */}
                    <AudioControls />

                    {/* Navigation Buttons */}
                    <nav className="w-2/3 flex flex-row justify-between items-center">
                        <Link href={"/"}>
                            <Icon.Home size={44} />
                        </Link>

                        <Link href={"/search"}>
                            <Icon.Search size={44} />
                        </Link>

                        <Link href={"/feed"}>
                            <Icon.Heart size={44} />
                        </Link>
                    </nav>
                </footer>
            </body>
        </html>
    );
}