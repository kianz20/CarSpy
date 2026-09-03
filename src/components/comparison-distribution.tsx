"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";

type DistributionBarProps = {
  label: string;
  /** Which metric this bar shows — picks the wording for the cheapest/most
   * expensive vs lowest/highest mileage edge-case sentences. */
  metric: "price" | "mileage";
  /** Make + model shown in the edge-case sentences, e.g. "Toyota Corolla". */
  model: string;
  min: number;
  max: number;
  avg: number;
  current: number;
  currentFormatted: string;
  avgFormatted: string;
  minFormatted: string;
  maxFormatted: string;
  /** Number of similar listings the min/avg/max were computed from. With
   * only one, min/avg/max are all the same value, which makes both the
   * "% through the range" and "% above/below average" figures meaningless. */
  count: number;
};

export function DistributionBar({
  label,
  metric,
  model,
  min,
  max,
  avg,
  current,
  currentFormatted,
  avgFormatted,
  minFormatted,
  maxFormatted,
  count,
}: DistributionBarProps) {
  const isBelow = current < avg;
  const isAbove = current > avg;
  const hasRange = max > min;
  const isCheapestOrLowest = hasRange && current === min;
  const isMostExpensiveOrHighest = hasRange && current === max;

  // Simple data for visualization - show the range with key points
  const data = [
    { position: "Min", value: min },
    { position: "Avg", value: avg },
    { position: "Max", value: max },
  ];

  return (
    <div className="space-y-4 rounded-lg border border-border/50 bg-surface-2/50 px-5 py-4">
      {/* Header with values */}
      <div>
        <div className="flex items-baseline justify-between gap-4 mb-3">
          <div>
            <span className="block text-sm font-semibold text-muted mb-1">{label}</span>
            <span className="text-2xl font-bold text-accent">{currentFormatted}</span>
          </div>
          <div className="text-right">
            <div className="text-xs text-muted mb-2">Value compared to:</div>
            <div className="space-y-1 text-sm">
              <div>
                <span className="text-muted">Avg: </span>
                <span className="font-semibold">{avgFormatted}</span>
              </div>
              <div>
                <span className="text-muted">Similar listings are between </span>
                <span className="font-semibold">{minFormatted}</span>  <span className="text-muted">and</span> <span className="font-semibold">{maxFormatted}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="w-full" style={{ height: "200px" }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 30, right: 150, left: 20, bottom: 60 }}
          >
            <CartesianGrid strokeDasharray="3 3" opacity={0.15} vertical={false} />
            <XAxis
              dataKey="position"
              tick={{ fontSize: 14, fontWeight: 500 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 12 }}
              width={60}
              domain={[Math.min(min, current), Math.max(max, current)]}
              tickFormatter={(value) => {
                if (Math.abs(value) >= 1000000) return `${(value / 1000000).toFixed(0)}M`;
                if (Math.abs(value) >= 1000) return `${(value / 1000).toFixed(0)}K`;
                return value.toString();
              }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--color-surface-2)",
                border: "2px solid var(--color-border)",
                borderRadius: "8px",
                padding: "10px",
              }}
              labelStyle={{ color: "var(--color-foreground)" }}
              formatter={(value) => {
                const num = Number(value);
                if (num === min) return minFormatted;
                if (num === max) return maxFormatted;
                if (num === avg) return avgFormatted;
                return value;
              }}
            />

            {/* Line showing the range */}
            <Line
              type="monotone"
              dataKey="value"
              stroke="var(--color-muted)"
              strokeWidth={2}
              dot={{ fill: "var(--color-muted)", r: 5 }}
              activeDot={{ r: 7 }}
            />

            {/* Reference line for average */}
            <ReferenceLine
              y={avg}
              stroke="var(--color-muted)"
              strokeDasharray="6 4"
              strokeWidth={2}
              opacity={0.6}
            />

            {/* Reference line for current - prominent */}
            <ReferenceLine
              y={current}
              stroke={isBelow ? "#10b981" : isAbove ? "#f59e0b" : "#3b82f6"}
              strokeWidth={4}
              strokeOpacity={0.8}
              label={{
                value: `You: ${currentFormatted}`,
                position: "right",
                fill: isBelow ? "#10b981" : isAbove ? "#f59e0b" : "#3b82f6",
                fontSize: 14,
                fontWeight: 700,
                offset: 5,
              }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Status indicator */}
      <div className="flex items-center justify-between gap-4 pt-4 pb-1 border-t border-border/30">
        <div className="text-sm text-muted">
          {isCheapestOrLowest ? (
            metric === "price" ? (
              <>This is the cheapest {model} being sold</>
            ) : (
              <>This is the lowest mileage {model} being sold</>
            )
          ) : isMostExpensiveOrHighest ? (
            metric === "price" ? (
              <>This is the most expensive {model} being sold</>
            ) : (
              <>This is the highest mileage {model} being sold</>
            )
          ) : hasRange ? (
            <>
              You are <span className="font-semibold">{Math.min(100, Math.max(0, ((current - min) / (max - min)) * 100)).toFixed(0)}%</span> of the way through the range
            </>
          ) : count > 1 ? (
            <>Based on {count - 1} other similar {count - 1 === 1 ? "listing" : "listings"}, all at {avgFormatted}</>
          ) : (
            <>No other similar listings to compare against yet</>
          )}
        </div>
        <div
          className={`flex items-center gap-2 rounded-full px-3 py-1 font-semibold text-sm self-center ${
            isBelow
              ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300"
              : isAbove
                ? "bg-amber-500/20 text-amber-700 dark:text-amber-300"
                : "bg-blue-500/20 text-blue-700 dark:text-blue-300"
          }`}
        >
          <span>{isBelow ? "↓" : isAbove ? "↑" : "="}</span>
          <span>
            {isBelow
              ? `${(((avg - current) / avg) * 100).toFixed(0)}% below`
              : isAbove
                ? `${(((current - avg) / avg) * 100).toFixed(0)}% above`
                : "At"}
            {!(!isBelow && !isAbove) && " average"}
          </span>
        </div>
      </div>
    </div>
  );
}
