import { getWebsocketUrl } from "@/app/actions/env";
import { NextResponse } from "next/server";

export async function GET() {
  const websocketUrl = getWebsocketUrl();
  return NextResponse.json({
    wsUrl: websocketUrl,
  });
}
