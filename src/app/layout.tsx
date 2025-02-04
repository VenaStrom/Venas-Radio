import "./global.scss";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "VR Radiospelare",
    description: "En radiospelare gjord av och till för Viggo.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="sv">
            <body>
                <header>Header</header>

                {children}

                <footer>Footer</footer>
            </body>
        </html>
    );
}