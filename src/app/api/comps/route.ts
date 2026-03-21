import { NextResponse } from "next/server";
import { getCompArchetypes } from "@/lib/mock-data";

export async function GET() {
  const comps = getCompArchetypes();
  return NextResponse.json({ comps });
}
