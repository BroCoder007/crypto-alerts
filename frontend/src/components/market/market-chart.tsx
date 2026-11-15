"use client";
import { memo, useMemo } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import {
  ASSETS,
  COINS,
  comparison,
  pointsFor,
  money,
  shortTime,
  type PricePoint,
  type Selection,
} from "@/lib/market";
function MarketChart({
  history,
  selection,
  paused,
}: {
  history: PricePoint[];
  selection: Selection;
  paused: boolean;
}) {
  const compare = selection === "ALL";
  const data = useMemo(
    () => (compare ? comparison(history) : pointsFor(history, selection)),
    [history, selection, compare],
  );
  if (data.length < 2)
    return (
      <div className="chart-empty">
        <span>⌁</span>
        <h3>A clearer picture takes a little history.</h3>
        <p>At least two recorded samples are needed for a trend.</p>
      </div>
    );
  return (
    <div
      className="chart-canvas"
      role="img"
      aria-label={
        compare
          ? "Percentage change since each asset’s first loaded sample. A sample table follows."
          : `${selection} price history in US dollars. A sample table follows.`
      }
    >
      <ResponsiveContainer
        width="100%"
        height="100%"
        minWidth={0}
        initialDimension={{ width: 400, height: 330 }}
      >
        <LineChart
          data={data}
          margin={{ top: 20, right: 12, bottom: 10, left: 5 }}
          accessibilityLayer
        >
          <CartesianGrid stroke="#ffffff0b" vertical={false} />
          <XAxis
            dataKey="time"
            type="number"
            scale="time"
            domain={["dataMin", "dataMax"]}
            tickFormatter={shortTime}
            stroke="#51544f"
            tickLine={false}
            axisLine={false}
            minTickGap={50}
            tick={{ fill: "#777d74", fontSize: 10 }}
          />
          <YAxis
            orientation="right"
            domain={["auto", "auto"]}
            tickFormatter={(v: number) =>
              compare ? `${v.toFixed(1)}%` : money(v)
            }
            stroke="#51544f"
            tickLine={false}
            axisLine={false}
            width={85}
            tick={{ fill: "#777d74", fontSize: 10 }}
          />
          <Tooltip
            contentStyle={{
              background: "#20211f",
              border: "1px solid #ffffff22",
              borderRadius: 10,
              fontSize: 12,
              color: "#e6e9e2",
            }}
            labelFormatter={(label) => new Date(Number(label)).toLocaleString()}
            formatter={(value) =>
              compare ? `${Number(value).toFixed(2)}%` : money(Number(value))
            }
          />
          {compare ? (
            COINS.map((coin) => (
              <Line
                key={coin}
                dataKey={coin}
                name={coin}
                stroke={ASSETS[coin].color}
                strokeWidth={2}
                dot={false}
                connectNulls={false}
                type="linear"
                isAnimationActive={!paused}
                animationDuration={500}
              />
            ))
          ) : (
            <Line
              dataKey="price"
              name={selection}
              stroke={ASSETS[selection].color}
              strokeWidth={2}
              dot={false}
              type="linear"
              isAnimationActive={!paused}
              animationDuration={500}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
export default memo(MarketChart);
