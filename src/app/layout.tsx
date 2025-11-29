import "./global.tw.css";
import { Nunito_Sans } from "next/font/google";
import type { Metadata } from "next";
import { AudioLinesIcon, HomeIcon, SearchIcon, HeartIcon } from "lucide-react";
import Link from "next/link";
import AudioControls from "@/components/audio-player";
import SettingsMenu from "@/components/settings-menu";
import packageJson from "../../package.json" with { type: "json" };
import { PlayProvider } from "@/components/play-context";

export const metadata: Metadata = {
  title: "VR Radiospelare",
  description: packageJson.description,
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
        url: "https://raw.githubusercontent.com/VenaStrom/Venas-Radio/refs/heads/main/public/icons/audio-lines.svg",
        secureUrl: "https://raw.githubusercontent.com/VenaStrom/Venas-Radio/refs/heads/main/public/icons/audio-lines.svg",
      },
    ],
  },
  creator: "Vena Ström <strom.vena+vr@gmail.com>",
  keywords: ["radio", "radiospelare", "audio", "ljud", "musik", "podcast", "streaming"],
  category: "Music",
  robots: "index, follow",
};

const nunitoSansFont = Nunito_Sans({ subsets: ["latin"] });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sv" className={nunitoSansFont.className}>
      <body className="bg-zinc-900 text-zinc-100">

        <header className="bg-zinc-950 p-2 flex flex-row items-center justify-between">
          <div className="flex flex-row items-center justify-center gap-1">
            <AudioLinesIcon />
            <p className="font-bold text-lg">VR</p>
          </div>

          <SettingsMenu />
        </header>

        <PlayProvider>
          {children}

          <footer className="bg-zinc-950 flex flex-col self-end items-center">
            {/* Audio Controls */}
            <AudioControls className="" />

            {/* Navigation Buttons */}
            <nav className="w-2/3 flex flex-row justify-between items-center py-3">
              <Link href={"/"}>
                <HomeIcon size={44} />
              </Link>

              <Link href={"/search"}>
                <SearchIcon size={44} />
              </Link>

              <Link href={"/feed"}>
                <HeartIcon size={44} />
              </Link>
            </nav>
          </footer>
        </PlayProvider>
      </body>
    </html>
  );
}