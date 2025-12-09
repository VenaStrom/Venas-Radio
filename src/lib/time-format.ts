
const dateLocale: [Intl.LocalesArgument, Intl.DateTimeFormatOptions] = ["sv-SE", { timeZone: "Europe/Stockholm", day: "2-digit", month: "short" }];
const timeLocale: [Intl.LocalesArgument, Intl.DateTimeFormatOptions] = ["sv-SE", { timeZone: "Europe/Stockholm", hour12: false, hour: "2-digit", minute: "2-digit" }];

export function getRelativeTimeString(date: Date): string {
  let formattedDate = date.toISOString().slice(0, 10); // Time insensitive date to compare with today and yesterday
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(new Date().setDate(new Date().getDate() - 1)).toISOString().slice(0, 10);

  if (formattedDate === today) {
    formattedDate = "Idag";
  }
  else if (formattedDate === yesterday) {
    formattedDate = "Igår";
  }
  else {
    formattedDate = date.toLocaleString(...dateLocale);
  }
  return formattedDate;
}

export function getLocaleTime(date: Date): string {
  return date.toLocaleString(...timeLocale);
}