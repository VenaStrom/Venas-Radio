import "./global.scss";
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

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="sv">
            <body>
                <header>
                    <Icon.AudioLines />
                    <p>VR</p>
                </header>

                {children}

                <footer>
                    <div id="player"></div>

                    <nav>
                        <Link href={"/"}>
                            <Icon.Home />
                        </Link>

                        <Link href={"/"}>
                            <Icon.Search />
                        </Link>

                        <Link href={"/"}>
                            <Icon.Heart fill="" />
                        </Link>
                    </nav>
                </footer>
            </body>
        </html>
    );
}