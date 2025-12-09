import { metadata } from "@/app/metadata";

let url = null;
if (process.env.NODE_ENV === "development") {
  url = "http://localhost:3000/";
}
else {
  if (!metadata.openGraph?.url) {
    throw new Error("Open Graph URL is not defined in production metadata.");
  }
  url = metadata.openGraph.url;
}
export const canonURL = url;