import { NextRequest, NextResponse } from "next/server";
import { LeaderboardService } from "@/services/LeaderboardService";
import { serializeBigInt } from "@/utils/serialization";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const region = searchParams.get("region") || "EUW1";
  const tier = searchParams.get("tier") || "ALL";
  const cursor = searchParams.get("cursor");
  const limit = Number.parseInt(searchParams.get("limit") || "50");

  try {
    const cursorBigInt = cursor ? BigInt(cursor) : undefined;
    const result = await LeaderboardService.getLeaderboard(
      region,
      tier,
      cursorBigInt,
      limit,
    );

    return NextResponse.json(serializeBigInt(result));
  } catch (error) {
    console.error("Leaderboard API Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
