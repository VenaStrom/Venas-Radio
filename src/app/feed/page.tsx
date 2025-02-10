"use client";

import React, { Suspense, useEffect, useState } from "react";
import { useEpisodeStore } from "@/store/episode-store";
import EpisodeDOM, { EpisodeSkeleton } from "@/components/episode";
import { EpisodeMap } from "@/types/episode-map";
import { Episode } from "@/types/episode";

const userSettings = {
    fetchBack: 2, // Days
    fetchForward: 1, // Days (should not be changed)
    programIDs: [4923, 178, 2778, 4540],
}

const fromDate = new Date();
fromDate.setDate(fromDate.getDate() - userSettings.fetchBack);
const toDate = new Date();
toDate.setDate(toDate.getDate() + 1);

export default function FeedPage() {
    const [episodeData, setEpisodeData] = useState<EpisodeMap>({});
    const programLinks = userSettings.programIDs.map((programID) =>
        `https://api.sr.se/api/v2/episodes/index?programid=${programID}&fromdate=${fromDate.toISOString().slice(0, 10)}&todate=${toDate.toISOString().slice(0, 10)}&format=json&pagination=false&audioquality=high`
    );

    useEffect(() => {
        const fetchEpisodes = async () => {
            const allEpisodes: EpisodeMap = {};

            for (const programLink of programLinks) {
                const response = await fetch(programLink);
                const data = await response.json();

                data.episodes.forEach((episode: Episode) => {
                    allEpisodes[episode.id] = {
                        ...episode,
                        publishDate: new Date(parseInt(episode.publishdateutc.replace(/\D/g, ""))),
                    };
                });
            }

            // Define their order via an index property
            const sortedEpisodes = Object.values(allEpisodes).sort((a, b) => {
                if (!a?.publishDate || !b?.publishDate) return 0;
                return b.publishDate.getTime() - a.publishDate.getTime();
            });

            sortedEpisodes.forEach((episode, index) => {
                allEpisodes[episode.id].index = index + 1;
            });

            // Save
            setEpisodeData(allEpisodes);
            useEpisodeStore.getState().setEpisodeData(allEpisodes);
        };

        fetchEpisodes();
    }, [programLinks]);

    return (
        <Suspense fallback={
            <main>
                <ul>
                    {new Array(20).fill(0).map((_, index) => {
                        return <EpisodeSkeleton key={index} />;
                    })}
                </ul>
            </main>
        }>
            <main>
                <ul className="flex flex-col gap-y-10 mt-2 mb-4">
                    {Object.values(episodeData).map((episode: Episode) => (
                        <EpisodeDOM episode={episode} style={{ order: episode.index }} key={episode.id} />
                    ))}
                </ul>
            </main>
        </Suspense>
    );
};


// "use client";

// import EpisodeDOM, { EpisodeSkeleton } from "@/components/episode";
// import { useEpisodeStore } from "@/store/episode-store";
// import { Episode } from "@/types/episode";
// import { EpisodeMap } from "@/types/episode-map";
// import { Suspense, useEffect, useState } from "react";

// const userSettings = {
//     fetchBack: 2, // Days
//     fetchForward: 1, // Days (should not be changed)
//     programIDs: [4923, 178, 2778, 4540],
// }

// const fromDate = new Date();
// fromDate.setDate(fromDate.getDate() - userSettings.fetchBack);
// const toDate = new Date();
// toDate.setDate(toDate.getDate() + 1);


// export default function FeedPage() {
//     const [episodeData, setEpisodeData] = useState<EpisodeMap>({});

//     const fetchLinks = userSettings.programIDs.map((programID) => `https://api.sr.se/api/v2/episodes/index?programid=${programID}&fromdate=${fromDate.toISOString().slice(0, 10)}&todate=${toDate.toISOString().slice(0, 10)}&format=json&pagination=false&audioquality=high`);

//     useEffect(() => {
//         fetchLinks.map((fetchLink) =>
//             fetch(fetchLink)
//                 .then((response) => response.json())
//                 .then((data: { episodes: Episode[] }) => {
//                     const indexedData = data.episodes.reduce((acc: EpisodeMap, episode: Episode) => { acc[episode.id] = episode; return acc; }, {} as EpisodeMap);

//                     const allEpisodes: EpisodeMap = { ...episodeData, ...indexedData };

//                     // Create proper date objects
//                     Object.values(allEpisodes)
//                         .filter((episode: Episode) => !episode.publishDate)
//                         .map((episode) => {
//                             allEpisodes[episode.id].publishDate = new Date(parseInt(episode.publishdateutc.replace(/\D/g, "")));
//                         });

//                     // Define their order via an index property
//                     Object.values(allEpisodes)
//                         .sort((a, b) => {
//                             if (!a?.publishDate || !b?.publishDate) return 0;
//                             return b?.publishDate?.getTime() - a?.publishDate?.getTime()
//                         })
//                         .map((episode, index) => {
//                             allEpisodes[episode.id].index = index;
//                         });

//                     // Save
//                     setEpisodeData(allEpisodes);
//                     useEpisodeStore.getState().setEpisodeData(allEpisodes);
//                 })
//         );
//     }, [episodeData, setEpisodeData, fetchLinks]);

//     return (
//         <Suspense fallback={
//             <main><ul>
//                 {new Array(20).fill(0).map((_, index) => {
//                     return <EpisodeSkeleton key={index} />;
//                 })}
//             </ul></main>
//         }>
//             <main>
//                 <ul className="flex flex-col gap-y-10 mt-2 mb-4">
//                     {Object.values(episodeData).map((episode) => (
//                         <EpisodeDOM episode={episode} className={`order-${episode.index || 0}`} key={episode.id} />
//                     ))}
//                 </ul>
//             </main>
//         </Suspense>
//     );
// }