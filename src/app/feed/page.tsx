import Image from "next/image";

interface Episode {
    id: number;
    title: string;
    description: string;
    url: string;
    program: {
        id: number;
        name: string;
    };
    audiopreference: string;
    audiopriority: string;
    audiopresentation: string;
    publishdateutc: string;
    imageurl: string;
    imageurltemplate: string;
    photographer: string;
    listenpodfile: {
        title: string;
        description: string;
        filesizeinbytes: number;
        program: {
            id: number;
            name: string;
        };
        availablefromutc: string;
        duration: number;
        publishdateutc: string;
        id: number;
        url: string;
        statkey: string;
    };
    downloadpodfile: {
        title: string;
        description: string;
        filesizeinbytes: number;
        program: {
            id: number;
            name: string;
        };
        availablefromutc: string;
        duration: number;
        publishdateutc: string;
        id: number;
        url: string;
        statkey: string;
    };
}
const episodeData: {
    [episodeID: number]: Episode;
} = {};

export default async function FeedPage() {
    // Time Span
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - 7);
    const toDate = new Date();
    toDate.setDate(toDate.getDate() + 1);

    const programIDs = [4923, 178, 2778];

    const episodes: React.ReactNode[] = [];

    for (const programID of programIDs) {
        const response = await fetch(`https://api.sr.se/api/v2/episodes/index?programid=${programID}&fromdate=${fromDate.toISOString().slice(0, 10)}&todate=${toDate.toISOString().slice(0, 10)}&format=json&pagination=false&audioquality=high`);
        const data: { episodes: Episode[] } = await response.json();

        data.episodes.forEach((episode: Episode) => {
            episodeData[episode.id] = episode;

            episodes.push(
                <li className="w-full flex flex-row justify-start" key={episode.id}>

                    <Image width={100} height={100} src={episode.imageurltemplate} alt="Avsnittsbild" className="rounded-md" fetchPriority="low" ></Image>

                    {episode.program.name} - {episode.title}
                </li>
            );
        });
    }

    // Sort by publish time
    episodes.sort((a: any, b: any) => {
        const publishTimeA: number = parseInt(episodeData[a?.key].listenpodfile.publishdateutc.replace(/\D/g, ""));
        const publishTimeB: number = parseInt(episodeData[b?.key].listenpodfile.publishdateutc.replace(/\D/g, ""));
        return publishTimeA - publishTimeB;
    });

    return (
        <main>
            <ul className="flex flex-col gap-2">
                {episodes}
            </ul>
        </main>
    )
}
