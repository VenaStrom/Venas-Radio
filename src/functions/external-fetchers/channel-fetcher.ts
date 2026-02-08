import { Channel } from "@/prisma/client/client";
import { SR_Channel } from "@/types/api/channel";

export async function fetchChannels(): Promise<Channel[]> {
  const baseURL = new URL("https://api.sr.se/api/v2/channels");
  baseURL.searchParams.append("format", "json");
  baseURL.searchParams.append("pagination", "false");

  const response: SR_Channel[] = await fetch(baseURL.toString())
    .then((res) => res.json())
    .then((data) => data.channels);

  const allChannels: Channel[] = response.map((channel: SR_Channel) => ({
    id: channel.id.toString(),
    name: channel.name,
    channel_type: channel.channeltype,
    color: channel.color,
    external_audio_url: channel.liveaudio.url,
    external_site_url: channel.siteurl,
    external_schedule_url: channel.scheduleurl ?? null,
    tagline: channel.tagline,
    image_square_url: channel.image,
    image_wide_url: channel.imagetemplate,
  } satisfies Channel));

  return allChannels;
}