export const COINS = ["BTC", "ETH", "SOL", "DOGE"] as const;
export type Coin = (typeof COINS)[number];
export type Selection = Coin | "ALL";
export const ASSETS: Record<
  Coin,
  { name: string; glyph: string; color: string }
> = {
  BTC: { name: "Bitcoin", glyph: "₿", color: "#baf49a" },
  ETH: { name: "Ethereum", glyph: "Ξ", color: "#aaa8ff" },
  SOL: { name: "Solana", glyph: "◎", color: "#8bdac4" },
  DOGE: { name: "Dogecoin", glyph: "Ð", color: "#e5ce8b" },
};
export interface CryptoStats {
  price: number;
  rsi: number;
  status: string;
  timestamp?: string;
  symbol?: string;
}
export interface PricePoint {
  timestamp: string;
  price: number;
  symbol?: string;
}
export type ComparisonRow = { time: number } & Partial<Record<Coin, number>>;
export function utcTime(value: string): number {
  if (!value) return NaN;
  const zoned = /(Z|[+-]\d{2}:\d{2})$/i.test(value);
  return Date.parse(value.replace(" ", "T") + (zoned ? "" : "Z"));
}
export function pointsFor(history: PricePoint[], coin: Coin) {
  return history
    .filter(
      (p) =>
        p.symbol === coin &&
        Number.isFinite(p.price) &&
        p.price > 0 &&
        Number.isFinite(utcTime(p.timestamp)),
    )
    .map((p) => ({ ...p, time: utcTime(p.timestamp) }))
    .sort((a, b) => a.time - b.time)
    .slice(-100);
}
export function windowChange(history: PricePoint[], coin: Coin): number | null {
  const points = pointsFor(history, coin);
  return points.length < 2
    ? null
    : (points[points.length - 1].price / points[0].price - 1) * 100;
}
export function comparison(history: PricePoint[]): ComparisonRow[] {
  const rows = new Map<number, ComparisonRow>();
  for (const coin of COINS) {
    const points = pointsFor(history, coin);
    if (!points.length) continue;
    const base = points[0].price;
    for (const point of points) {
      const minute = Math.floor(point.time / 60000) * 60000;
      const row = rows.get(minute) || { time: minute };
      row[coin] = (point.price / base - 1) * 100;
      rows.set(minute, row);
    }
  }
  return [...rows.values()].sort((a, b) => a.time - b.time);
}
export function money(value?: number) {
  return value === undefined || !Number.isFinite(value) || value <= 0
    ? "—"
    : new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: value < 1 ? 5 : 2,
      }).format(value);
}
export function percent(value: number | null) {
  return value === null ? "—" : `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
}
export function shortTime(value: number) {
  return new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(value);
}
export function csv(history: PricePoint[]) {
  const rows = [
    ["timestamp_utc", "symbol", "price_usd"],
    ...history
      .filter(
        (p) =>
          Number.isFinite(utcTime(p.timestamp)) &&
          Number.isFinite(p.price) &&
          p.price > 0 &&
          COINS.includes(p.symbol as Coin),
      )
      .map((p) => [
        new Date(utcTime(p.timestamp)).toISOString(),
        p.symbol!,
        p.price,
      ]),
  ];
  return rows
    .map((row) =>
      row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(","),
    )
    .join("\r\n");
}
