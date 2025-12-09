import { canonURL } from "./canon-url";

export function proxy(url: string): string {
  const urlObject = new URL("/api/sr", canonURL);
  urlObject.searchParams.set("req", url);
  return urlObject.toString();
}
export function unproxy(proxiedUrl: string): URL | null {
  const url = new URL(proxiedUrl);
  const reqParam = url.searchParams.get("req");
  return reqParam ? new URL(decodeURIComponent(reqParam)) : null;
}