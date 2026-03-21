import { NextResponse } from "next/server";
import type { GameStateInput } from "@/types/api";
import { getRecommendations } from "@/lib/mock-data";

export async function POST(request: Request) {
  try {
    const input: GameStateInput = await request.json();

    // Basic validation
    if (!input || typeof input !== "object") {
      return NextResponse.json(
        { error: "Bad Request", message: "Invalid input", statusCode: 400 },
        { status: 400 }
      );
    }

    // Use mock data for now — will be replaced with real DB queries
    const response = getRecommendations(input);

    return NextResponse.json(response);
  } catch {
    return NextResponse.json(
      {
        error: "Internal Server Error",
        message: "Failed to generate recommendations",
        statusCode: 500,
      },
      { status: 500 }
    );
  }
}
