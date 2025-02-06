"use client";
import React, { useEffect, useState } from "react";
import EpisodeDOM, { EpisodeDOMPlaceholder } from "@/components/episode";
import type { Episode } from "@/types/episode";

const settings = {
    pastFetchTime: 2, // Days
};

export default function FeedPage() {
    const [episodeData, setEpisodeData] = useState<{ [episodeID: number]: Episode }>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const userTimeProgress: { [episodeID: number]: number } = {}; // In seconds

    useEffect(() => {
        async function fetchEpisodes() {
            const newEpisodeData: { [episodeID: number]: Episode } = {};

            // Time span
            const fromDate = new Date();
            fromDate.setDate(fromDate.getDate() - settings.pastFetchTime);
            const toDate = new Date();
            toDate.setDate(toDate.getDate() + 1);

            const programIDs = [4923, 178, 2778, 4540];

            try {
                for (const programID of programIDs) {
                    const response = await fetch(
                        `https://api.sr.se/api/v2/episodes/index?programid=${programID}&fromdate=${fromDate.toISOString().slice(0, 10)}&todate=${toDate.toISOString().slice(0, 10)}&format=json&pagination=false&audioquality=high`
                    );
                    const data: { episodes: Episode[] } = await response.json();

                    data.episodes.forEach((episode: Episode) => {
                        newEpisodeData[episode.id] = episode;
                    });
                }
                setEpisodeData(newEpisodeData);
            } catch (err) {
                setError("Failed to fetch episodes.");
            } finally {
                setLoading(false);
            }
        }

        fetchEpisodes();
    }, []);

    // Skeletons
    if (loading) return <main>
        {new Array(10).fill(null).map((_, index) => (
            <li className="list-none" key={index}>
                {EpisodeDOMPlaceholder()}
            </li>
        ))}
    </main>;
    
    if (error) return <main>{error}</main>;

    const episodesArray = Object.values(episodeData);

    // Sort by publish time descending
    episodesArray.sort((a, b) => {
        const publishTimeA = parseInt(a.publishdateutc.replace(/\D/g, ""));
        const publishTimeB = parseInt(b.publishdateutc.replace(/\D/g, ""));
        return publishTimeB - publishTimeA;
    });

    return (
        <main>
            <ul className="flex flex-col gap-y-10 mt-2 mb-4">
                {episodesArray.map((episode) => (
                    <li key={episode.id}>
                        {EpisodeDOM(episode, episodeData, userTimeProgress)}
                    </li>
                ))}
            </ul>
        </main>
    );
}