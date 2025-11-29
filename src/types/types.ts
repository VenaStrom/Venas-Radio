
export type PlayPause = "playing" | "paused";

export type Episode = {
  id: number;
  title: string;
  description: string;
  image: {
    square: string;
    wide: string;
  };
  url: string;
  program: {
    id: number;
    name: string;
  }
  publishDate: Date;
  duration: number;
}