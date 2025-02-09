import FeedClient from "@/app/feed/feed-client";
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
    // const episodeStore = useEpisodeStore();
    const episodeData: Episode[] = [];

    // Make promise array
    const promises = userSettings.programIDs.map(async (programID) => {
        return fetch(`https://api.sr.se/api/v2/episodes/index?programid=${programID}&fromdate=${fromDate.toISOString().slice(0, 10)}&todate=${toDate.toISOString().slice(0, 10)}&format=json&pagination=false&audioquality=high`)
            .then((response) => response.json())
            .then((data) => { episodeData.push(...data.episodes); });
    });

    // Await all promises
    await Promise.all(promises);

    // Create proper date objects
    episodeData.map((episode) => {
        episode.publishDate = new Date(parseInt(episode.publishdateutc.replace(/\D/g, "")));
    });

    // Sort by publish date
    episodeData.sort((a, b) => {
        if (!a?.publishDate || !b?.publishDate) return 0;
        return b.publishDate.getTime() - a.publishDate.getTime();
    });

    return <FeedClient episodeData={episodeData} />;
}
