import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

export async function GET() {
  const scenarios = await prisma.scenario.findMany({ orderBy: { createdAt: "asc" } });
  return NextResponse.json(scenarios);
}
