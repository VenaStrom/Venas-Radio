
"use client";
import EpisodeDOM from "@/components/episode";
import { useEpisodeStore } from "@/store/episode-store";
import { Episode } from "@/types/episode";

export default function FeedClient({ episodeData }: { episodeData: Episode[] }) {
    // Re-save as dictionary with ID as key
    const episodeDictionary = episodeData.reduce((acc, episode) => {
        acc[episode.id] = episode;
        return acc;
    }, {} as Record<number, Episode>);

    useEpisodeStore.setState({ episodeData: episodeDictionary });

    return (
        <main>
            <ul className="flex flex-col gap-y-10 mt-2 mb-4">
                {Object.values(episodeData).map((episode) => (
                    <EpisodeDOM episode={episode} key={episode.id} />
                ))}
            </ul>
        </main>
    );
}