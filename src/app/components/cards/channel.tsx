import type { Channel } from "@/api/lib/prisma/generated";
import SR_Attribute from "@/app/components/cards/sr-attribute";

export function ChannelCard({ channel }: { channel: Channel }): React.ReactNode {
  return (
    <li className="w-full flex flex-row h-28 items-center justify-start">

      {/* Thumbnail */}
      <img
        className="bg-zinc-600 rounded-md h-24 w-24 max-h-24 max-w-24 min-h-24 min-w-24 me-4"
        width={96} height={96}
        src={channel.image}
        alt={`Kanalbild för ${channel.name}`}
        fetchPriority="low"
      />

      <div className="h-full flex flex-col justify-start items-start gap-y-1 flex-1">
        <div className="flex flex-row justify-between items-center w-full">
          {/* Channel name */}
          <p className="font-bold overflow-hidden flex flex-row gap-x-2 items-center">
            {channel.name}
          </p>

          <div className="flex flex-row gap-x-4 items-center">
            {/* <LikeButton channelID={channel.id} /> */}
            {/* <PlayButton channel={channel} iconSize={28} /> */}
            <span>LIKE</span>
            <span>PLAY</span>
          </div>
        </div>

        <SR_Attribute />

        {/* Description */}
        <p className="text-xs font-normal col-span-2">
          {channel.tagline}
        </p>

        <span className="flex-1"></span>

        <div className="flex flex-row justify-end items-center w-full">
        </div>
      </div>
    </li>
  );
}

function Skeleton() {
  return (
    <li className="flex flex-row h-28 items-center gap-x-4 w-full">
      {/* Thumbnail */}
      <div className="bg-zinc-600 rounded-md size-24 animate-pulse"></div>

      {/* Header Text */}
      <div className="h-full flex-1 flex flex-col gap-y-1 pt-1">
        {/* Program name */}
        <div className="bg-zinc-600 rounded-md h-4 w-28 animate-pulse"></div>

        {/* Other info */}
        <div className="bg-zinc-600 rounded-sm h-3 animate-pulse w-36 mt-3"></div>
        <div className="bg-zinc-600 rounded-md h-6 animate-pulse w-36 mt-1"></div>
      </div>
    </li>
  );
}
ChannelCard.Skeleton = Skeleton;