import "./global.tw.css";
import { Nunito_Sans } from "next/font/google";
import { HomeIcon, SearchIcon, HeartIcon } from "lucide-react";
import Link from "next/link";
import AudioControls from "@/components/audio-player";
import { PlayProvider } from "@/components/play-context/play-context-provider";
import { Title } from "./title";
import MigrationHandler from "@/components/migration/migration-handler";

// eslint-disable-next-line react-refresh/only-export-components
export { metadata } from "./metadata";

const nunitoSansFont = Nunito_Sans({ subsets: ["latin"] });

export default function RootLayout({ children }: { children: React.ReactNode }) {

  return (
    <html lang="sv" className={nunitoSansFont.className}>
      <body className="bg-zinc-900 text-zinc-100">

        <header className="bg-zinc-950 p-2 flex flex-row items-center justify-between">
          <Title />
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
  );
}