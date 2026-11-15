import {
  COINS,
  type Coin,
  type CryptoStats,
  type PricePoint,
  utcTime,
} from "./market";
export type { CryptoStats, PricePoint } from "./market";
async function request(path: string, signal?: AbortSignal) {
  const response = await fetch("/api/market/" + path, {
    cache: "no-store",
    signal,
  });
  if (!response.ok) throw Error("The market data service is unavailable.");
  return response.json();
}
export async function getStats(
  symbol: Coin = "BTC",
  signal?: AbortSignal,
): Promise<CryptoStats> {
  const data = await request("stats?symbol=" + symbol, signal);
  if (
    !data ||
    !Number.isFinite(data.price) ||
    !Number.isFinite(data.rsi) ||
    typeof data.status !== "string"
  )
    throw Error("Invalid price response.");
  return data;
}
export async function getHistory(
  symbol: string = "BTC",
  signal?: AbortSignal,
): Promise<PricePoint[]> {
  const data: unknown = await request(
    "history?symbol=" + encodeURIComponent(symbol),
    signal,
  );
  if (!Array.isArray(data)) throw Error("Invalid history response.");
  return data.filter(
    (p): p is PricePoint =>
      !!p &&
      typeof p.timestamp === "string" &&
      Number.isFinite(utcTime(p.timestamp)) &&
      Number.isFinite(p.price) &&
      p.price > 0 &&
      (p.symbol === undefined || COINS.includes(p.symbol)),
  );
}
