import type { SR_Program } from "@/types/api/program";
import type { SR_Channel } from "@/types/api/channel";
import type { SR_Episode } from "@/types/api/episode";

export function isSR_Program(value: unknown): value is SR_Program {
  return true;
}


export function isSR_Channel(value: unknown): value is SR_Channel {
  return true;
}

export function isSR_Episode(value: unknown): value is SR_Episode {
  return true;
}