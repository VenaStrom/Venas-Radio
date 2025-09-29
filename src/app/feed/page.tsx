"use client";

import React, { useEffect, useMemo, useState } from "react";
import EpisodeDOM, { EpisodeSkeleton } from "@/components/episode-dom";
import { useSettingsStore } from "@/store/settings-store";
import { useContentStore } from "@/store/content-store";
import type { ContentMap } from "@/types/maps";
import type { Content } from "@/types/api/content";
import type { Episode } from "@/types/api/episode";

export default function FeedPage() {
  const [episodeData, setEpisodeData] = useState<ContentMap>({});
  const [isLoading, setIsLoading] = useState(true);

  const userSettings = useSettingsStore((state) => state.settings);

  const fromDate = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() - userSettings.fetchBack);
    return date;
  }, [userSettings.fetchBack]);

  const toDate = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() + userSettings.fetchForward);
    return date;
  }, [userSettings.fetchForward]);

  useEffect(() => {
    const fetchEpisodes = async () => {
      const programLinks = userSettings.programIDs.map((programID) =>
        `https://api.sr.se/api/v2/episodes/index?programid=${programID}&fromdate=${fromDate.toISOString().slice(0, 10)}&todate=${toDate.toISOString().slice(0, 10)}&format=json&pagination=false&audioquality=high`
      );

      const allEpisodes: ContentMap = {};

      const fetchPromises = programLinks.map((link) => fetch(link).then((res) => res.json()));
      const results = await Promise.all(fetchPromises);

      for (const data of results) {
        // Convert to Content
        data.episodes
          .filter((episode: Episode) => episode.listenpodfile || episode.downloadpodfile) // TODO handle streams
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
              },
              meta: {
                saveProgress: true,
                disableDragProgress: false,
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
  }, [fromDate, toDate, userSettings.programIDs]);

  const episodes = useMemo(() => Object.values(episodeData).sort((a, b) => b.publishDate.getTime() - a.publishDate.getTime()), [episodeData]);

  return (
    <main>
      <ul className={`flex flex-col mt-2 mb-4 ${userSettings.compactView ? "gap-y-2" : "gap-y-10"}`}>
        {isLoading ? (
          <>
            {new Array(30).fill(0).map((_, index) => (
              <EpisodeSkeleton key={"episode-skeleton-" + index} />
            ))}
          </>
        ) : (
          episodes.map((episode: Content, i: number) => {
            const dom = <EpisodeDOM episode={episode} key={episode.id} />;

            const thisDate = episode.publishDate.toISOString().slice(0, 10);
            const prevDate = i > 0 ? episodes[i - 1].publishDate.toISOString().slice(0, 10) : null;

            if (thisDate === prevDate) return dom;

            return (
              <React.Fragment key={episode.id + "-fragment"}>
                <li className="w-full text-sm  text-zinc-400" key={"date-header-" + thisDate + "-" + prevDate}>
                  {thisDate === new Date().toISOString().slice(0, 10)
                    ? "Idag"
                    : thisDate === new Date(new Date().setDate(new Date().getDate() - 1)).toISOString().slice(0, 10)
                      ? "Igår"
                      : episode.publishDate.toLocaleDateString("sv-SE", { weekday: "long", month: "short", day: "numeric" })}
                </li>
                {dom}
              </React.Fragment>
            );
          })
        )}
      </ul>
    </main>
  );
}