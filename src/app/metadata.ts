import { Metadata } from "next";
import packageJson from "../../package.json" with { type: "json" };

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
    url: "https://vr.venastrom.se/",
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