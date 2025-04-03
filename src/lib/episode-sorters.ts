import type { Episode, SortFunction } from "@/types";
import type { FeedSort } from "@prisma/client";

export const sortMap: Record<FeedSort, SortFunction> = {
  NEWEST: sortNewest,
  OLDEST: sortOldest,
  OLDEST_PER_DAY: sortOldestPerDay,
}

export function sortNewest(a: Episode, b: Episode) {
  return b.publishDateUTC.getTime() - a.publishDateUTC.getTime();
}

export function sortOldest(a: Episode, b: Episode) {
  return a.publishDateUTC.getTime() - b.publishDateUTC.getTime();
}

/** 
 * Sorts episodes so that the first episode every day is the oldest one for that day for easier chronological listening.
 */
export function sortOldestPerDay(a: Episode, b: Episode) {
  const aDate = a.publishDateUTC.toISOString().slice(0, 10);
  const bDate = b.publishDateUTC.toISOString().slice(0, 10);

  if (aDate === bDate) {
    return sortOldest(a, b);
  }
  else if (aDate < bDate) return 1;
  else return -1;
}
