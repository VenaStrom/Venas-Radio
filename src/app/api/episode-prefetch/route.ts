import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { refreshEpisodesForPrograms } from "@/lib/episode-prefetch";

const maxProgramIds = 50;

type PrefetchPayload = {
  programIds?: string[];
};

function normalizeIdList(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  return input
    .map((id) => (typeof id === "string" || typeof id === "number" ? id.toString() : ""))
    .map((id) => id.trim())
    .filter(Boolean)
    .slice(0, maxProgramIds);
}

export async function POST(request: Request) {
  let payload: PrefetchPayload | null = null;
  try {
    payload = (await request.json()) as PrefetchPayload;
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const programIds = normalizeIdList(payload?.programIds);
  if (programIds.length === 0) {
    return NextResponse.json({ error: "No program ids provided" }, { status: 400 });
  }

  const validPrograms = await prisma.program.findMany({
    where: { id: { in: programIds } },
    select: { id: true },
  });
  const validProgramIds = validPrograms.map((program) => program.id);
  if (validProgramIds.length === 0) {
    return NextResponse.json({ error: "No matching programs found" }, { status: 404 });
  }

  const result = await refreshEpisodesForPrograms(validProgramIds);

  return NextResponse.json({ ok: true, ...result });
}
