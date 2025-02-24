"use client";

import React, { useEffect, useState } from "react";
import EpisodeDOM, { EpisodeSkeleton } from "@/components/episode-dom";
import { useSettingsStore } from "@/store/settings-store";
import { useContentStore } from "@/store/content-store";
import type { ContentMap } from "@/types/maps";
import type { Content } from "@/types/api/content";
import type { Episode } from "@/types/api/episode";

const userSettings = useSettingsStore.getState().settings;

const fromDate = new Date();
fromDate.setDate(fromDate.getDate() - userSettings.fetchBack);
const toDate = new Date();
toDate.setDate(toDate.getDate() + 1);

export default function FeedPage() {
    const [episodeData, setEpisodeData] = useState<ContentMap>({});
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchEpisodes = async () => {
            const programLinks = userSettings.programIDs.map((programID) =>
                `https://api.sr.se/api/v2/episodes/index?programid=${programID}&fromdate=${fromDate.toISOString().slice(0, 10)}&todate=${toDate.toISOString().slice(0, 10)}&format=json&pagination=false&audioquality=high`
            );

            const allEpisodes: ContentMap = {};

            for (const programLink of programLinks) {
                const response = await fetch(programLink);
                const data = await response.json();


                // Convert to Content
                data.episodes
                    .filter((episode: Episode) => episode.listenpodfile || episode.downloadpodfile)
                    .forEach((episode: Episode) => {
                        allEpisodes[episode.id] = {
                            id: episode.id,
                            title: episode.title,
                            description: episode.description,
                            url: episode?.listenpodfile?.url || episode?.downloadpodfile?.url,
                            program: {
                                id: episode.program.id,
                                name: episode.program.name,
                            },
                            publishDate: new Date(parseInt(episode.publishdateutc.replace(/\D/g, ""))),
                            duration: episode.listenpodfile.duration || episode.downloadpodfile.duration || 0,
                            image: {
                                square: episode.imageurl,
                                wide: episode.imageurltemplate,
                            }
                        };
                    });
            }

            // Save
            setEpisodeData(allEpisodes);
            useContentStore.getState().appendContentData(allEpisodes);
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
                    Object.values(episodeData)
                        .sort((a, b) => b.publishDate.getTime() - a.publishDate.getTime())
                        .map((episode: Content, i: number) => (
                            <EpisodeDOM episode={episode} style={{ order: i }} key={episode.id} />
                        ))
                )}
            </ul>
        </main>
    );
}