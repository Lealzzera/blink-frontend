import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    wsUrl: process.env.NEXT_PUBLIC_BLINK_BE_PUBLIC_WS_URL,
  });
}
