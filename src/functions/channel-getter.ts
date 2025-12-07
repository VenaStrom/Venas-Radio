import { SR_Channel } from "@/types/api/channel";
import { ChannelDB } from "@/types/types";

export async function fetchChannels(): Promise<ChannelDB> {
  const response: SR_Channel[] = await fetch("https://api.sr.se/api/v2/channels?format=json&pagination=false")
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
        square: channel.image,
        wide: channel.imagetemplate,
      },
      url: channel.liveaudio.url,
      scheduleUrl: channel.scheduleurl,
      siteUrl: channel.siteurl,
      tagline: channel.tagline,
    };
  });

  return allChannels;
}