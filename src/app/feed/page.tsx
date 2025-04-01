import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { Program, User } from "@prisma/client";

function fetchEpisodes(programId: string, config: User) {
  // Fetch episodes
  const fromDate = new Date(Date.now() - config.fetchSpan * 86400000);
  const toDate = new Date(Date.now() + 1 * 86400000); // 1 day ahead to include today
  const toFormattedDate = (date: Date) => date.toISOString()
  // const makeURL = (programId: string) => `${process.env.API_EPISODE_URL}?programid=${programId}&${process.env.API_COMMON_ARGS}`;
  // const fetchURLs = user.programs.map((program) => makeURL(program.id.toString()));
  // console.debug(fetchURLs);

  const args = `programid=${programId}&fromdate=${fromDate.toISOString()}&todate=${toDate.toISOString()}`;
}

export default async function FeedPage() {
  const userId = (await currentUser())?.id;
  if (!userId) return <main>Unauthorized</main>;

  const dbUser = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      programs: {
        include: { episodes: true },
      },
    },
  });

  if (!dbUser) return <main>User not found</main>;

  dbUser.programs.forEach((program) => {
    if (!program.episodes.length) {
      console.info(`No episodes for program ${program.name}`);
    }
  });

  return (<main>
    inloggad
  </main>);
}