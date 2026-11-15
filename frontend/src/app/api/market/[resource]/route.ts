import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ resource: string }> },
) {
  const { resource } = await params;
  const symbol = request.nextUrl.searchParams.get("symbol") || "BTC";
  if (
    !["stats", "history"].includes(resource) ||
    !["BTC", "ETH", "SOL", "DOGE", "ALL"].includes(symbol) ||
    (resource === "stats" && symbol === "ALL")
  )
    return NextResponse.json(
      { error: "Unknown market request" },
      { status: 400 },
    );
  try {
    const base = process.env.CRYPTO_API_URL || "http://127.0.0.1:8000";
    const url = new URL("/" + resource, base);
    url.searchParams.set("symbol", symbol);
    const result = await fetch(url, {
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    if (!result.ok)
      return NextResponse.json(
        {
          error: "Market service unavailable. Check the backend and collector.",
        },
        { status: 503 },
      );
    return NextResponse.json(await result.json(), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return NextResponse.json(
      { error: "Market service unavailable. Check the backend and collector." },
      { status: 503 },
    );
  }
}
