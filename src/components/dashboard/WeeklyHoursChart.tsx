import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import type { WeekData } from "@/pages/Index";

interface Props {
  data: WeekData[];
  selectedIdx: number;
  fullWidth?: boolean;
}

export function WeeklyHoursChart({ data, selectedIdx, fullWidth }: Props) {
  const last26 = data.slice(Math.max(0, data.length - 26));
  const offsetIdx = selectedIdx - Math.max(0, data.length - 26);

  const chartData = last26.map((w, i) => ({
    name: w.sheet,
    hours: w.total_hours ?? 0,
    etp: w.etp ?? 0,
    budget: w.budget ?? 0,
    selected: i === offsetIdx,
  }));

  return (
    <div className={`kpi-card ${fullWidth ? "" : ""}`}>
      <h3 className="text-sm font-semibold text-muted-foreground mb-4">
        Heures totales par semaine (26 dernières)
      </h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="hoursGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="name"
              tick={{ fontSize: 11, fill: "hsl(215, 16%, 47%)" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "hsl(215, 16%, 47%)", fontFamily: "Roboto Mono" }}
              axisLine={false}
              tickLine={false}
              width={45}
            />
            <Tooltip
              contentStyle={{
                background: "hsl(0, 0%, 100%)",
                border: "1px solid hsl(214, 32%, 91%)",
                borderRadius: 8,
                fontSize: 12,
                fontFamily: "Roboto Mono",
              }}
              formatter={(value: number, name: string) => [
                value.toLocaleString("fr-FR"),
                name === "hours" ? "Heures" : name,
              ]}
            />
            <Area
              type="monotone"
              dataKey="hours"
              stroke="hsl(217, 91%, 60%)"
              strokeWidth={2}
              fill="url(#hoursGrad)"
            />
            {offsetIdx >= 0 && (
              <ReferenceLine
                x={chartData[offsetIdx]?.name}
                stroke="hsl(217, 91%, 20%)"
                strokeDasharray="4 4"
                strokeWidth={1}
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
