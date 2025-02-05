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
            <body className="bg-zinc-900 text-zinc-50">

                <header className="sticky bg-zinc-950 p-2 flex flex-row items-center justify-between">
                    <div className="flex flex-row items-center justify-center gap-2">
                        <Icon.AudioLines />
                        <p className="font-bold text-lg">VR</p>
                    </div>

                    <Icon.Settings />
                </header>

                {children}

                <footer className="bg-zinc-950 p-4 flex flex-col self-end">
                    <div id="player"></div>

                    <nav className="flex flex-row justify-between items-center">
                        <Link href={"/"}>
                            <Icon.Home size={64} />
                        </Link>

                        <Link href={"/"}>
                            <Icon.Search size={64} />
                        </Link>

                        <Link href={"/"}>
                            <Icon.Heart size={64} />
                        </Link>
                    </nav>
                </footer>
            </body>
        </html>
    );
}