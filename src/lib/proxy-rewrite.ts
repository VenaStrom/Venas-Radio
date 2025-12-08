
export function proxy(url: string): string {
  return `/api/sr?req=${encodeURIComponent(url)}`;
}
export function unproxy(proxiedUrl: string): string | null {
  const url = new URL(proxiedUrl);
  const reqParam = url.searchParams.get("req");
  return reqParam ? decodeURIComponent(reqParam) : null;
}