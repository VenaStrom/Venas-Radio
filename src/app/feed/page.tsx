// import React from "react";
// import EpisodeDOM from "@/components/episode-dom";

export default function FeedPage() {


  return (
    <main>
      <ul className="flex flex-col mt-2 mb-4 gap-y-8">
        hi!:3
        {/* {episodes.map((episode, i) => {
          const bareEpisode = <EpisodeDOM episode={episode} key={episode.id} />;

          const thisDate = episode.publishDate.toISOString().slice(0, 10);
          const prevDate = i > 0 ? episodes[i - 1].publishDate.toISOString().slice(0, 10) : null;

          if (thisDate === prevDate) return bareEpisode; // No day shift

          let dateHeader = "";

          const today = new Date().toISOString().slice(0, 10)

          const allowedRelativeDays = [-2, -1, 0, 1, 2];

          const relativeTimeFormatter = new Intl.RelativeTimeFormat("sv-SE", { numeric: "auto", style: "narrow" });

          const dayDiff = (new Date(thisDate).getTime() - new Date(today).getTime()) / (1000 * 60 * 60 * 24);

          if (allowedRelativeDays.includes(dayDiff)) {
            dateHeader = relativeTimeFormatter.format(dayDiff, "day");
          }
          else {
            dateHeader = episode.publishDate.toLocaleDateString(
              "sv-SE", { weekday: "long", month: "short", day: "numeric" }
            );
          }

          if (dayDiff > 0) {
            dateHeader += " (tidig publicering)";
          }

          return (
            <React.Fragment key={episode.id + "-fragment"}>
              <li className="w-full -mb-6 text-sm text-center text-zinc-400" key={"date-header-" + thisDate + "-" + prevDate}>
                {dateHeader}
              </li>
              {bareEpisode}
            </React.Fragment>
          );
        })} */}
      </ul>
    </main>
  );
}