import { Fragment, Suspense } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { cookies } from "next/headers";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import EpisodeDOM from "@/components/episode-dom";
import EpisodeDOMSkeleton from "@/components/episode-dom-skeleton";
import { getEpisodes } from "@/functions/fetchers/get-episodes";
import type { EpisodeWithProgram } from "@/types/types";
import FeedRefreshButton from "@/app/feed/feed-refresh-button";
import { refreshEpisodesForPrograms } from "@/lib/episode-prefetch";

const likedProgramsCookieKey = "likedPrograms";
const likedProgramsCookieLimit = 50;
const unauthPrefetchProgramLimit = 5;
const unauthPrefetchWindowDays = 7;
const unauthPrefetchConcurrency = 2;

async function readLikedProgramsFromCookie(): Promise<string[]> {
  const store = await cookies();
  const raw = store.get(likedProgramsCookieKey)?.value;
  if (!raw) return [];
  try {
    const parsed = JSON.parse(decodeURIComponent(raw)) as string[] | number[];
    return parsed.map((id) => id.toString()).filter(Boolean).slice(0, likedProgramsCookieLimit);
  } catch {
    return [];
  }
}

async function readLikedProgramsFromUser(userId: string | null): Promise<string[]> {
  if (!userId) return [];
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { favorite_programs: { select: { id: true } } },
  });
  return user?.favorite_programs.map((program) => program.id) ?? [];
}

function getEpisodeDate(episode: EpisodeWithProgram): Date {
  return episode.publish_date instanceof Date
    ? episode.publish_date
    : new Date(episode.publish_date);
}

function getDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function formatDateHeader(date: Date, todayKey: string, formatter: Intl.RelativeTimeFormat): string {
  const dateKey = getDateKey(date);
  const dayDiff = Math.round(
    (new Date(dateKey).getTime() - new Date(todayKey).getTime()) / (1000 * 60 * 60 * 24)
  );
  const allowedRelativeDays = [-2, -1, 0, 1, 2];

  let label = "";
  if (allowedRelativeDays.includes(dayDiff)) {
    label = formatter.format(dayDiff, "day");
  } else {
    label = date.toLocaleDateString(
      "sv-SE",
      { weekday: "long", month: "short", day: "numeric" }
    );
  }

  if (dayDiff > 0) {
    label += " (tidig publicering)";
  }

  return label;
}

export default function FeedPage() {
  return (
    <Suspense fallback={<FeedSkeleton />}>
      <FeedPageContent />
    </Suspense>
  );
}

async function FeedPageContent() {
  const { userId } = await auth();
  const [cookieIds, userIds] = await Promise.all([
    readLikedProgramsFromCookie(),
    readLikedProgramsFromUser(userId),
  ]);
  const programIds = Array.from(new Set([...cookieIds, ...userIds]));
  let episodes = programIds.length > 0 ? await getEpisodes({ programIds }) : [];
  const isUnauthenticated = !userId;
  const shouldPrefetch = isUnauthenticated && programIds.length > 0 && episodes.length === 0;

  if (shouldPrefetch) {
    const limitedProgramIds = programIds.slice(0, unauthPrefetchProgramLimit);
    await refreshEpisodesForPrograms(limitedProgramIds, {
      windowDays: unauthPrefetchWindowDays,
      concurrency: unauthPrefetchConcurrency,
    });
    episodes = await getEpisodes({ programIds });
  }

  if (programIds.length === 0) {
    return (
      <main className="p-0 overflow-y-hidden flex flex-col">
        <EmptyState
          title="Inga favoriter än"
          description="Folj program för att se deras senaste avsnitt."
        />
      </main>
    );
  }

  if (episodes.length === 0) {
    return (
      <main className="p-0 overflow-y-hidden flex flex-col">
        <EmptyState
          title="Inga avsnitt än"
          description="Dina favoriter har inga nya avsnitt just nu."
          action={<FeedRefreshButton programIds={programIds} />}
        />
      </main>
    );
  }

  const todayKey = getDateKey(new Date());
  const relativeTimeFormatter = new Intl.RelativeTimeFormat("sv-SE", { numeric: "auto", style: "narrow" });

  return (
    <main className="p-0 overflow-y-hidden flex flex-col">
      <ul
        className={
          "flex-1 min-h-0 w-full overflow-y-auto flex flex-col gap-y-8 pt-4 px-6 last:pb-10"
        }
      >
        {episodes.map((episode, i) => {
          const publishDate = getEpisodeDate(episode);
          const thisDateKey = getDateKey(publishDate);
          const prevDateKey = i > 0 ? getDateKey(getEpisodeDate(episodes[i - 1])) : null;

          if (thisDateKey === prevDateKey) {
            return <EpisodeDOM episode={episode} key={episode.id} />;
          }

          const dateHeader = formatDateHeader(publishDate, todayKey, relativeTimeFormatter);

          return (
            <Fragment key={`${episode.id}-fragment`}>
              <li className="w-full -mb-6 text-sm text-center text-zinc-400">
                {dateHeader}
              </li>
              <EpisodeDOM episode={episode} />
            </Fragment>
          );
        })}
      </ul>
    </main>
  );
}

function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <section className="flex flex-col items-center text-center gap-3 mt-12 px-6">
      <h2>{title}</h2>
      <p className="text-sm text-zinc-300">{description}</p>
      {action}
      <Link href="/search">Utforska program</Link>
    </section>
  );
}

function FeedSkeleton() {
  return (
    <main className="p-0 overflow-y-hidden flex flex-col">
      <ul className="flex-1 min-h-0 w-full overflow-y-auto flex flex-col gap-y-8 pt-4 px-6 last:pb-10">
        {new Array(8).fill(0).map((_, i) => (
          <EpisodeDOMSkeleton key={i} />
        ))}
      </ul>
    </main>
  );
}