import prisma from "@/lib/prisma";
import { fetchEpisodeById } from "@/functions/external-fetchers/episode-fetcher";
import { fetchProgramById } from "@/functions/external-fetchers/program-fetcher";

export async function ensureEpisodeAudioSource(
  episodeId: string,
): Promise<{ id: string; external_audio_url: string } | null> {
  const existing = await prisma.episode.findUnique({
    where: { id: episodeId },
    select: { id: true, external_audio_url: true, program_id: true },
  });

  if (existing?.external_audio_url) {
    return existing;
  }

  const fetchedEpisode = await fetchEpisodeById(episodeId);
  if (!fetchedEpisode?.external_audio_url) {
    return null;
  }

  const programId = fetchedEpisode.program_id;
  const existingProgram = await prisma.program.findUnique({
    where: { id: programId },
    select: { id: true },
  });

  if (!existingProgram) {
    const fetchedProgram = await fetchProgramById(programId);
    if (!fetchedProgram) {
      return null;
    }

    let channelId = fetchedProgram.channel_id ?? null;
    if (channelId) {
      const channelExists = await prisma.channel.findUnique({
        where: { id: channelId },
        select: { id: true },
      });
      if (!channelExists) {
        channelId = null;
      }
    }

    await prisma.program.create({
      data: {
        ...fetchedProgram,
        channel_id: channelId,
      },
    });
  }

  return prisma.episode.upsert({
    where: { id: fetchedEpisode.id },
    update: {
      title: fetchedEpisode.title,
      description: fetchedEpisode.description,
      external_audio_url: fetchedEpisode.external_audio_url,
      publish_date: fetchedEpisode.publish_date,
      duration: fetchedEpisode.duration,
      image_square_url: fetchedEpisode.image_square_url,
      image_wide_url: fetchedEpisode.image_wide_url,
      program_id: fetchedEpisode.program_id,
    },
    create: fetchedEpisode,
    select: { id: true, external_audio_url: true },
  });
}
