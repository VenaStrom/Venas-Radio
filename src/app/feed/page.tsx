import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";

export default async function FeedPage() {
  const userId = (await currentUser())?.id;
  if (!userId) return <main>Unauthorized</main>;

  const dbUser = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      programs: true,
    },
  });

  return (<main>
    {JSON.stringify(dbUser, null, 2)}
  </main>);
}