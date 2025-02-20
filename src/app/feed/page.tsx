"use client";

import React, { useEffect, useState } from "react";
import { useEpisodeStore } from "@/store/episode-store";
import EpisodeDOM, { EpisodeSkeleton } from "@/components/episode-dom";
import { EpisodeMap } from "@/types/maps";
import { Episode } from "@/types/api/episode";
import { useSettingsStore } from "@/store/settings-store";

const userSettings = useSettingsStore.getState().settings;

const fromDate = new Date();
fromDate.setDate(fromDate.getDate() - userSettings.fetchBack);
const toDate = new Date();
toDate.setDate(toDate.getDate() + 1);

export default function FeedPage() {
    const [episodeData, setEpisodeData] = useState<EpisodeMap>({});
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchEpisodes = async () => {
            const programLinks = userSettings.programIDs.map((programID) =>
                `https://api.sr.se/api/v2/episodes/index?programid=${programID}&fromdate=${fromDate.toISOString().slice(0, 10)}&todate=${toDate.toISOString().slice(0, 10)}&format=json&pagination=false&audioquality=high`
            );

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
                allEpisodes[episode.id].order = index + 1;
            });

            // Save
            setEpisodeData(allEpisodes);
            useEpisodeStore.getState().setEpisodeData(allEpisodes);
            setIsLoading(false);
        };

        fetchEpisodes();
    }, []);

    return (
        <main>
            <ul className="flex flex-col gap-y-10 mt-2 mb-4">
                {isLoading ? (
                    <>
                        {new Array(10).fill(0).map((_, index) => (
                            <EpisodeSkeleton key={index} />
                        ))}
                    </>
                ) : (
                    Object.values(episodeData).map((episode: Episode) => (
                        <EpisodeDOM episode={episode} style={{ order: episode.order }} key={episode.id} />
                    ))
                )}
            </ul>
        </main>
    );
}