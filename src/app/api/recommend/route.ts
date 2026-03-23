import { NextResponse } from "next/server";
import type { GameStateInput } from "@/types/api";
import { getRecommendations as getRealRecommendations } from "@/lib/recommendation/engine";

export async function POST(request: Request) {
  try {
    const input: GameStateInput = await request.json();

    if (!input || typeof input !== "object") {
      return NextResponse.json(
        { error: "Bad Request", message: "Invalid input", statusCode: 400 },
        { status: 400 }
      );
    }

    const response = await getRealRecommendations(input);

    return NextResponse.json(response);
  } catch (err) {
    console.error("Recommendation error:", err);
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
