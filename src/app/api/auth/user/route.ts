import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function POST(req: NextRequest, res: NextResponse) {
  const { userID } = req.body as unknown as { userID: string };

  console.debug(userID);

  res.json()
}