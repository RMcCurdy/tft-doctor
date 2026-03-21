import { NextResponse } from "next/server";
import { getAugments } from "@/lib/mock-data";

export async function GET() {
  const augments = getAugments();
  return NextResponse.json({ augments });
}
