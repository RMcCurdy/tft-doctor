import { NextResponse } from "next/server";
import { getCompletedItems } from "@/lib/mock-data";

export async function GET() {
  const items = getCompletedItems();
  return NextResponse.json({ items });
}
