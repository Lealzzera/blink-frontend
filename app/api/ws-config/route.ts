import { websocketUrl } from "@/app/actions/env";
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    wsUrl: websocketUrl,
  });
}
