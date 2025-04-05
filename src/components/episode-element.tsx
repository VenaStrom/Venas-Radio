import type { EpisodeProgress, User } from "@prisma/client";
import type { Episode } from "@/types";
import { SRAttribute } from "@/components/sr-attribute";
import { PlayButton } from "@/components/play-button";
import { Progress } from "@shadcn/progress";
import Image from "next/image";

export async function EpisodeElement(
  { episode, userId, progress, className = "" }: { episode: Episode, userId: string, progress: EpisodeProgress | null, className?: string }
) {
  /* Date and time */
  const pubDate = new Date(episode.publishDateUTC);
  const isToday = pubDate.toISOString().slice(0, 10) === new Date().toISOString().slice(0, 10);
  const isYesterday = pubDate.toISOString().slice(0, 10) === new Date(new Date().setDate(new Date().getDate() - 1)).toISOString().slice(0, 10);
  const prettyTime = `kl. ${pubDate.toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit" })}`;
  const prettyDate = pubDate.toLocaleDateString("sv-SE", { weekday: "short", month: "short", day: "2-digit" });
  // E.g. mån 31 mars kl 06.00
  const prettyDateTime = `${isToday ? "Idag" : isYesterday ? "Igår" : prettyDate} ${prettyTime}`;

  /** Progress */
  if (!progress) {
    progress = {
      userId: userId,
      episodeId: episode.id,
      progress: 0,
    } as EpisodeProgress;
  }
  const progressSeconds = progress.progress || 0;
  const progressMinutes = Math.floor(progressSeconds / 60);

  /* Duration and remaining */
  const durationSeconds = episode.podfile.duration;
  const durationMinutes = Math.floor(durationSeconds / 60);
  const prettyDuration = `${durationMinutes} min`;

  const remainingSeconds = durationSeconds - progressSeconds;
  const remainingMinutes = Math.floor(remainingSeconds / 60);
  const prettyRemaining = durationMinutes <= 0 ? `${remainingSeconds} sek kvar` : `${remainingMinutes} min kvar`;

  return (
    <li className={`w-full grid grid-cols-[128px_1fr] grid-rows-[min_min_min_1fr] gap-2 ${className}`} id={episode.id.toString()}>
      {/* SR Attribute */}
      <SRAttribute className="col-span-2" />

      {/* Thumbnail */}
      <Image width={128} height={72} src={episode.imageWideHD} alt="Avsnittsbild" className="bg-zinc-600 rounded-md"></Image>

      {/* Header Text */}
      <div className="col-start-2">
        <p className="text-sm font-light overflow-hidden">{episode.program.name}</p>
        <p className="text-sm font-bold overflow-hidden">{episode.title}</p>
      </div>

      {/* Description */}
      <p className="text-xs pt-1 font-normal overflow-hidden col-span-2">{episode.description}</p>

      {/* Progress Bar */}
      <Progress className="col-span-2 w-full h-1" value={progressSeconds / durationSeconds} max={100} />

      {/* Metadata */}
      <div className="col-span-2 flex flex-row justify-between items-center">
        <p className="text-xs text-zinc-400 flex flex-row gap-x-2">
          <span>{prettyDateTime}</span>

          &middot;

          <span>{prettyDuration}</span>

          {progressSeconds > 0 &&
            <>
              &middot;

              <span>{prettyRemaining}</span>
            </>
          }
        </p>

        <PlayButton episode={episode} userId={userId} progress={progressSeconds} />
      </div>
    </li>
  );
}