import "@/app/global.tw.css";
import { ClerkProvider } from "@clerk/nextjs";
import { Nunito_Sans, Geist, Geist_Mono } from "next/font/google";
import { HomeIcon, SearchIcon, HeartIcon, AudioLinesIcon } from "lucide-react";
import Link from "next/link";
import AudioControls from "@/components/audio-player";
import { PlayProvider } from "@/components/play-context/play-context-provider";
import MigrationHandler from "@/components/migration/migration-handler";
import { Sidebar } from "@/app/sidebar";
import { ensureEpisodePrefetchScheduler } from "@/lib/episode-prefetch-scheduler";

// eslint-disable-next-line react-refresh/only-export-components
export { metadata } from "@/app/metadata";

const nunitoSansFont = Nunito_Sans({ subsets: ["latin"] });
const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"], });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"], });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  ensureEpisodePrefetchScheduler();
  return (<ClerkProvider>
    <html lang="sv" className={`${nunitoSansFont.className} ${geistSans.variable} ${geistMono.variable}`}>
      <body className="bg-zinc-900 text-zinc-100">

        <header className="bg-zinc-950 p-2 flex flex-row items-center justify-between">
          <div className="flex flex-row items-center justify-center gap-1 select-none">
            <AudioLinesIcon />
            <p className="font-bold text-lg">VR</p>
          </div>

          <Sidebar />
        </header>

        <PlayProvider>
          <MigrationHandler />
          {children}

          <footer className="bg-zinc-950 flex flex-col self-end items-center">
            {/* Audio Controls */}
            <AudioControls />

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
  </ClerkProvider>);
}