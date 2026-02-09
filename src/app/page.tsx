import ChannelDOM from "@/components/channel-dom";
import { getChannels } from "@/functions/fetchers/get-channels";
import SearchInput from "@/app/search/search-input";
import Link from "next/link";
import { Suspense } from "react";

type HomePageProps = {
  searchParams?: Promise<{
    q?: string;
  }>;
};

export default function HomePage({ searchParams }: HomePageProps) {
  return (
    <main>
      {/* Intro section */}
      <section className="w-full flex flex-col items-center text-center mt-12">
        <h1 className="text-2xl">Välkommen till Venas Radio</h1>

        <p>
          Venas Radio är en webbaserad radioapp som låter dig lyssna på radiokanaler och -program från Sveriges Radio, via deras <Link href={"https://api.sr.se/api/documentation/v2/index.html"} target="_blank">öppna API</Link>.
        </p>
      </section>

      {/* Live Channels */}
      <section className="w-full flex flex-col items-center mt-16">
        <h2 className="mb-5">Lyssna live</h2>

        <Suspense fallback={<ChannelListSkeleton />}>
          <ChannelsContent searchParams={searchParams} />
        </Suspense>
      </section>
    </main>
  );
}

async function ChannelsContent({ searchParams }: HomePageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const searchQuery = typeof resolvedSearchParams?.q === "string" ? resolvedSearchParams.q : "";
  const channels = await getChannels({ search: searchQuery });

  return (
    <>
      <div className="h-0 w-full flex justify-center">
        <SearchInput
          initialQuery={searchQuery}
          placeholder="Sök kanal..."
        />
      </div>
      <ul className="w-full flex flex-col gap-y-4 pt-4 last:pb-10">
        {channels.map((channel) => (
          <ChannelDOM channel={channel} key={channel.id} />
        ))}
      </ul>
    </>
  );
}

function ChannelListSkeleton() {
  return (
    <ul
      className="flex-1 min-h-0 w-full flex flex-col gap-y-4 pt-4 last:pb-10"
    >
      {new Array(10).fill(0).map((_, i) => (
          <ChannelDOM.Skeleton key={i} />
      ))}
    </ul>
  );
}