import EpisodeDOM from "@/components/episode";
import type { Episode } from "@/types/episode";

const settings = {
    pastFetchTime: 7, // Days
};
const episodeData: { [episodeID: number]: Episode } = {};
const userTimeProgress: { [episodeID: number]: number } = {}; // In seconds

export default async function FeedPage() {
    // Time Span
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - settings.pastFetchTime);
    const toDate = new Date();
    toDate.setDate(toDate.getDate() + 1);

    const programIDs = [4923, 178, 2778, 4540]; // , 5380

    for (const programID of programIDs) {
        const response = await fetch(`https://api.sr.se/api/v2/episodes/index?programid=${programID}&fromdate=${fromDate.toISOString().slice(0, 10)}&todate=${toDate.toISOString().slice(0, 10)}&format=json&pagination=false&audioquality=high`);
        const data: { episodes: Episode[] } = await response.json();

        data.episodes.forEach((episode: Episode) => {
            episodeData[episode.id] = episode;
        });
    }

    const episodes: React.ReactNode[] = [];

    Object.values(episodeData).forEach((episode: Episode) => {
        episodes.push(EpisodeDOM(episode, episodeData, userTimeProgress));
    });

    // Sort by publish time
    episodes.sort((a: any, b: any) => {
        const publishTimeA: number = parseInt(episodeData[a?.key].publishdateutc.replace(/\D/g, ""));
        const publishTimeB: number = parseInt(episodeData[b?.key].publishdateutc.replace(/\D/g, ""));
        return publishTimeB - publishTimeA;
    });

    return (
        <main>
            <ul className="flex flex-col gap-y-10 mt-2 mb-4">
                {episodes}
            </ul>
        </main>
    )
}