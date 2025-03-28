
export type User = {
  id: string;
  username: string;
  programs: Program[];
}

export type Program = {
  id: string;
  name: string;
  publishDate: Date;
}

export type Channel = {
  id: string;
  name: string;
  publishDate: Date;
}