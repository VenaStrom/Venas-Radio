import EpisodeDOM from "@/components/episode";
import { useEpisodeStore } from "@/store/episode-store";
import type { Episode } from "@/types/episode";

const userSettings = {
    fetchBack: 2, // Days
    fetchForward: 1, // Days (should not be changed)
    programIDs: [4923, 178, 2778, 4540],
}

const fromDate = new Date();
fromDate.setDate(fromDate.getDate() - userSettings.fetchBack);
const toDate = new Date();
toDate.setDate(toDate.getDate() + 1);

export default async function FeedPage() {
    const episodeData: Episode[] = [];

    for (const programID of userSettings.programIDs) {
        const response = await fetch(
            `https://api.sr.se/api/v2/episodes/index?programid=${programID}&fromdate=${fromDate.toISOString().slice(0, 10)}&todate=${toDate.toISOString().slice(0, 10)}&format=json&pagination=false&audioquality=high`
        );
        const data: { episodes: Episode[] } = await response.json();

        episodeData.push(...data.episodes);
    }

    // Create proper date objects
    episodeData.map((episode) => {
        episode.publishDate = new Date(parseInt(episode.publishdateutc.replace(/\D/g, "")));
    });

    // Sort by publish date
    episodeData.sort((a, b) => {
        if (!a?.publishDate || !b?.publishDate) return 0;
        return b.publishDate.getTime() - a.publishDate.getTime();
    });

    // Re-save as dictionary with ID as key
    const episodeDictionary = episodeData.reduce((acc, episode) => {
        acc[episode.id] = episode;
        return acc;
    }, {} as Record<number, Episode>);

    // Store episodes in global state
    useEpisodeStore.getState().setEpisodeData(episodeDictionary);

    return (
        <main>
            <ul className="flex flex-col gap-y-10 mt-2 mb-4">
                {Object.values(episodeData).map((episode) => (
                    <EpisodeDOM episode={episode} key={episode.id} />
                ))}
            </ul>
        </main>
    )
}