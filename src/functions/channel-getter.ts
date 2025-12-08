import { proxy } from "@/lib/proxy-rewrite";
import { SR_Channel } from "@/types/api/channel";
import { ChannelDB } from "@/types/types";

export async function fetchChannels(): Promise<ChannelDB> {
  const baseURL = new URL("https://api.sr.se/api/v2/channels");
  baseURL.searchParams.append("format", "json");
  baseURL.searchParams.append("pagination", "false");

  const response: SR_Channel[] = await fetch(proxy(baseURL.toString()))
    .then((res) => res.json())
    .then((data) => data.channels);

  const allChannels: ChannelDB = {};
  response.forEach((channel: SR_Channel) => {
    allChannels[channel.id] = {
      id: channel.id,
      name: channel.name,
      channelType: channel.channeltype,
      color: channel.color,
      image: {
        square: proxy(channel.image),
        wide: proxy(channel.imagetemplate),
      },
      url: proxy(channel.liveaudio.url),
      scheduleUrl: proxy(channel.scheduleurl),
      siteUrl: channel.siteurl,
      tagline: channel.tagline,
    };
  });

  return allChannels;
}