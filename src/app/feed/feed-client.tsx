
"use client";
import EpisodeDOM from "@/components/episode";
import { useEpisodeStore } from "@/store/episode-store";
import { Episode } from "@/types/episode";

export default function FeedClient({ episodeData }: { episodeData: Episode[] }) {

    useEpisodeStore.setState({ episodeData });

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