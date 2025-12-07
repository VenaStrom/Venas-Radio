"use client";

import React, { useMemo } from "react";
import EpisodeDOM, { EpisodeSkeleton } from "@/components/episode-dom";
import { usePlayContext } from "@/components/play-context/play-context-use";

export default function FeedPage() {
  const { episodeDB, isFetchingEpisodes: isFetching } = usePlayContext();

  const episodes = useMemo(() => {
    const allEpisodes = Object.values(episodeDB);
    allEpisodes.sort((a, b) => b.publishDate.getTime() - a.publishDate.getTime());
    return allEpisodes;
  }, [episodeDB]);

  return (
    <main>
      <ul className="flex flex-col mt-2 mb-4 gap-y-10">
        {isFetching ? (
          <>
            {new Array(30).fill(0).map((_, index) => (
              <EpisodeSkeleton key={"episode-skeleton-" + index} />
            ))}
          </>
        ) : (
          episodes.map((episode, i) => {
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