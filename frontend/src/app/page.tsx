"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area, Legend } from "recharts";
import { GlassCard } from "@/components/ui/glass-card";
import { PulseIndicator } from "@/components/ui/pulse-indicator";
import { getStats, getHistory, CryptoStats, PricePoint } from "@/lib/api";
import { clsx } from "clsx";

const COINS = ["BTC", "ETH", "SOL", "DOGE"];
const COIN_COLORS: Record<string, string> = {
  BTC: "#f59e0b", // Amber
  ETH: "#6366f1", // Indigo
  SOL: "#14b8a6", // Teal
  DOGE: "#fbbf24" // Yellow
};

export default function Home() {
  const [selectedCoin, setSelectedCoin] = useState("BTC");
  const [stats, setStats] = useState<CryptoStats | null>(null);
  const [history, setHistory] = useState<any[]>([]); // simplified type for pivoted data
  const [loading, setLoading] = useState(true);

  // Poll for data every 2 seconds
  useEffect(() => {
    const fetchData = async () => {
      try {
        // If ALL, we fetch distinct history but maybe just default stats (or skip stats)
        const statsReq = selectedCoin === "ALL" ? getStats("BTC") : getStats(selectedCoin);
        const historyReq = getHistory(selectedCoin);

        const [statsData, historyData] = await Promise.all([statsReq, historyReq]);

        if (selectedCoin !== "ALL") {
          setStats(statsData);
          // Convert UTC to Local Time
          const localHistory = historyData.map((pt) => ({
            ...pt,
            timestamp: new Date(pt.timestamp + "Z").toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }));
          setHistory(localHistory);
        } else {
          setStats(null); // Clear stats in comparison mode or show summary

          // PIVOT Logic for "ALL"
          // Backend returns flat list: [{timestamp: T1, symbol: BTC, price: P1}, {timestamp: T1, symbol: ETH, price: P2}...]
          // We need: [{timestamp: T1, BTC: P1, ETH: P2}...]

          const pivoted: Record<string, any> = {};

          historyData.forEach((pt: any) => {
            const timeKey = new Date(pt.timestamp + "Z").toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            if (!pivoted[timeKey]) {
              pivoted[timeKey] = { timestamp: timeKey };
            }
            if (pt.symbol) {
              pivoted[timeKey][pt.symbol] = pt.price;
            }
          });

          // Convert back to array and sort
          const localHistory = Object.values(pivoted).sort((a: any, b: any) =>
            a.timestamp.localeCompare(b.timestamp)
          );
          // Limit to last 30 points to keep chart clean
          setHistory(localHistory.slice(-30));
        }

        setLoading(false);
      } catch (e) {
        console.error("Connection error", e);
      }
    };

    fetchData(); // Initial load
    const interval = setInterval(fetchData, 2000); // Polling
    return () => clearInterval(interval);
  }, [selectedCoin]);

  // Determine status color
  const getStatusColor = (s: string) => {
    if (s === "OVERSOLD") return "text-emerald-400";
    if (s === "OVERBOUGHT") return "text-red-400";
    return "text-slate-400";
  };

  return (
    <main className="min-h-screen p-8 pb-20 sm:p-20 font-[family-name:var(--font-sans)]">
      {/* Header */}
      <header className="max-w-7xl mx-auto mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-white mb-2">
            Crypto<span className="text-[var(--primary)]">Command</span>
          </h1>
          <p className="text-slate-400">Real-time Market Intelligence</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-3">
            <PulseIndicator status={!loading ? "active" : "warning"} />
            <span className="text-sm font-medium text-slate-300">
              {loading ? "CONNECTING..." : "SYSTEM ONLINE"}
            </span>
          </div>

          {/* Coin Selector */}
          <div className="flex bg-slate-800 rounded-lg p-1 gap-1">
            {COINS.map(coin => (
              <button
                key={coin}
                onClick={() => setSelectedCoin(coin)}
                className={clsx(
                  "px-4 py-1.5 text-sm font-medium rounded-md transition-all",
                  selectedCoin === coin
                    ? "bg-indigo-500 text-white shadow-lg"
                    : "text-slate-400 hover:text-white hover:bg-slate-700"
                )}
              >
                {coin}
              </button>
            ))}
            <div className="w-px h-6 bg-slate-700 mx-1 self-center"></div>
            <button
              onClick={() => setSelectedCoin("ALL")}
              className={clsx(
                "px-4 py-1.5 text-sm font-medium rounded-md transition-all",
                selectedCoin === "ALL"
                  ? "bg-fuchsia-500 text-white shadow-lg"
                  : "text-slate-400 hover:text-white hover:bg-slate-700"
              )}
            >
              COMPARE ALL
            </button>
          </div>
        </div>
      </header>

      {/* Main Grid */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">

        {/* KPI Cards - Hidden if ALL is selected */}
        {selectedCoin !== "ALL" && (
          <>
            {/* KPI: Current Price */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <GlassCard className="h-full flex flex-col justify-between">
                <h3 className="text-slate-400 text-sm font-uppercase tracking-wider">Current Price</h3>
                <div className="mt-4">
                  <span className="text-5xl font-bold text-white tracking-tight">
                    {stats ? `$${stats.price.toLocaleString()}` : "---"}
                  </span>
                  <div className="mt-2 text-sm text-emerald-400 font-medium">{stats?.symbol || selectedCoin} Live</div>
                </div>
              </GlassCard>
            </motion.div>

            {/* KPI: RSI Status */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <GlassCard className="h-full flex flex-col justify-between">
                <h3 className="text-slate-400 text-sm font-uppercase tracking-wider">RSI Momentum</h3>
                <div className="mt-4">
                  <div className="flex items-end gap-3">
                    <span className={clsx("text-5xl font-bold tracking-tight", stats && getStatusColor(stats.status))}>
                      {stats ? stats.rsi : "--"}
                    </span>
                    <span className="text-lg text-slate-500 mb-2">/ 100</span>
                  </div>
                  <div className="mt-2 text-sm font-semibold tracking-wide text-white">
                    SIGNAL: <span className={stats ? getStatusColor(stats.status) : ""}>{stats?.status || "Analyzing..."}</span>
                  </div>
                </div>
              </GlassCard>
            </motion.div>

            {/* Active Config */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <GlassCard className="h-full flex flex-col justify-between relative overflow-hidden">
                <div className="absolute top-0 right-0 p-3 opacity-10">
                  <svg width="100" height="100" viewBox="0 0 24 24" fill="white"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" /></svg>
                </div>
                <h3 className="text-slate-400 text-sm font-uppercase tracking-wider">Active Configuration</h3>
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between text-sm border-b border-slate-700 pb-2">
                    <span className="text-slate-300">Target Coin</span>
                    <span className="text-white font-medium">{selectedCoin}</span>
                  </div>
                  <div className="flex justify-between text-sm border-b border-slate-700 pb-2">
                    <span className="text-slate-300">Interval</span>
                    <span className="text-white font-medium">60s</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-300">Telegram Bot</span>
                    <span className="text-emerald-400 font-medium">Connected</span>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          </>
        )}

        {/* Comparison Header if ALL */}
        {selectedCoin === "ALL" && (
          <motion.div className="md:col-span-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <GlassCard className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white">Market Comparison</h2>
                <p className="text-slate-400">Live performance of major assets</p>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-500 uppercase tracking-wider block">Mode</span>
                <span className="text-fuchsia-400 font-bold">Multi-Asset Overlay</span>
              </div>
            </GlassCard>
          </motion.div>
        )}

        {/* Interactive Chart */}
        <motion.div className="md:col-span-3" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4 }}>
          <GlassCard>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-white font-semibold text-lg">
                {selectedCoin === "ALL" ? "Multi-Asset Performance" : "Live Market Trend"}
              </h3>
            </div>

            <div className="h-[450px] w-full resize-y overflow-hidden min-h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                {selectedCoin === "ALL" ? (
                  /* COMPARISON CHART (Multi Line) */
                  <LineChart data={history}>
                    <XAxis dataKey="timestamp" tick={false} axisLine={false} />
                    <YAxis
                      domain={['auto', 'auto']}
                      orientation="right"
                      tick={{ fill: '#94a3b8', fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff' }} />
                    <Legend />
                    {COINS.map(coin => (
                      <Line
                        key={coin}
                        type="monotone"
                        dataKey={coin}
                        stroke={COIN_COLORS[coin]}
                        strokeWidth={2}
                        dot={false}
                      />
                    ))}
                  </LineChart>
                ) : (
                  /* INDIVIDUAL CHART (Area) */
                  <AreaChart data={history}>
                    <defs>
                      <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={COIN_COLORS[selectedCoin] || "#fbbf24"} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={COIN_COLORS[selectedCoin] || "#fbbf24"} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="timestamp" tick={false} axisLine={false} />
                    <YAxis
                      domain={['auto', 'auto']}
                      orientation="right"
                      tick={{ fill: '#94a3b8', fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff' }} itemStyle={{ color: COIN_COLORS[selectedCoin] || '#fbbf24' }} />
                    <Area
                      type="monotone"
                      dataKey="price"
                      stroke={COIN_COLORS[selectedCoin] || "#fbbf24"}
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorPrice)"
                    />
                  </AreaChart>
                )}
              </ResponsiveContainer>
            </div>
          </GlassCard>
        </motion.div>
      </div>
    </main>
  );
}
