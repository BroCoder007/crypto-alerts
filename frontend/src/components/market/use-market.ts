"use client";
import { useEffect, useState } from "react";
import { getStats, getHistory } from "@/lib/api";
import {
  COINS,
  type Coin,
  type CryptoStats,
  type PricePoint,
} from "@/lib/market";
export function useMarket() {
  const [data, setData] = useState<{
    stats: Partial<Record<Coin, CryptoStats>>;
    history: PricePoint[];
    state: "connecting" | "online" | "partial" | "offline";
    received: number | null;
  }>({ stats: {}, history: [], state: "connecting", received: null });
  useEffect(() => {
    let alive = true,
      busy = false;
    let timer: ReturnType<typeof setTimeout>;
    let controller: AbortController;
    async function refresh() {
      if (busy || !alive) return;
      if (document.hidden) {
        timer = setTimeout(refresh, 5000);
        return;
      }
      busy = true;
      controller = new AbortController();
      try {
        const result = await Promise.allSettled([
          getHistory("ALL", controller.signal),
          ...COINS.map((coin) => getStats(coin, controller.signal)),
        ]);
        if (!alive) return;
        const failed = result.filter((r) => r.status === "rejected").length;
        setData((previous) => {
          const stats = { ...previous.stats };
          COINS.forEach((coin, index) => {
            const entry = result[index + 1];
            if (entry.status === "fulfilled")
              stats[coin] = entry.value as CryptoStats;
          });
          const incoming =
            result[0].status === "fulfilled"
              ? (result[0].value as PricePoint[])
              : previous.history;
          const history =
            JSON.stringify(incoming) === JSON.stringify(previous.history)
              ? previous.history
              : incoming;
          return {
            stats,
            history,
            state:
              failed === result.length
                ? "offline"
                : failed
                  ? "partial"
                  : "online",
            received: failed === result.length ? previous.received : Date.now(),
          };
        });
      } finally {
        busy = false;
        if (alive) timer = setTimeout(refresh, 5000);
      }
    }
    const visibility = () => {
      if (!document.hidden) {
        clearTimeout(timer);
        refresh();
      }
    };
    document.addEventListener("visibilitychange", visibility);
    refresh();
    return () => {
      alive = false;
      clearTimeout(timer);
      controller?.abort();
      document.removeEventListener("visibilitychange", visibility);
    };
  }, []);
  return data;
}
