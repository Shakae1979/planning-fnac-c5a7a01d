import { useMemo, useState } from "react";
import type { WeekData } from "@/pages/Index";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Search } from "lucide-react";

interface Props {
  data: WeekData[];
  allNames: string[];
}

export function TeamOverview({ data, allNames }: Props) {
  const [search, setSearch] = useState("");

  const employeeStats = useMemo(() => {
    return allNames.map((name) => {
      let totalWeeks = 0;
      let totalHours = 0;
      let totalDiff = 0;
      let absences = 0;
      let lastSeen = "";

      data.forEach((w) => {
        const emp = w.employees.find((e) => e.name === name);
        if (emp) {
          totalWeeks++;
          totalHours += emp.hm;
          totalDiff += emp.diff;
          if (emp.hm === 0) absences++;
          if (w.week_start) lastSeen = w.week_start;
        }
      });

      return {
        name,
        totalWeeks,
        totalHours,
        avgHours: totalWeeks > 0 ? totalHours / totalWeeks : 0,
        totalDiff,
        absences,
        lastSeen,
      };
    });
  }, [data, allNames]);

  const filtered = employeeStats.filter((e) =>
    e.name.toLowerCase().includes(search.toLowerCase())
  );

  // Chart data: top 15 by avg hours
  const chartData = [...filtered]
    .sort((a, b) => b.avgHours - a.avgHours)
    .slice(0, 15)
    .map((e) => ({ name: e.name, avg: Math.round(e.avgHours * 10) / 10 }));

  return (
    <div className="space-y-6">
      <div className="kpi-card">
        <h3 className="text-sm font-semibold text-muted-foreground mb-4">
          Heures moyennes par collaborateur (Top 15)
        </h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical" margin={{ left: 80, right: 20 }}>
              <XAxis type="number" tick={{ fontSize: 11, fontFamily: "Roboto Mono" }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} width={80} />
              <Tooltip
                contentStyle={{ borderRadius: 8, fontSize: 12, fontFamily: "Roboto Mono" }}
                formatter={(v: number) => [`${v}h`, "Moyenne"]}
              />
              <Bar dataKey="avg" fill="hsl(217, 91%, 60%)" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="kpi-card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-muted-foreground">
            Tous les collaborateurs ({filtered.length})
          </h3>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Rechercher..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-1.5 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="pb-3 font-semibold text-muted-foreground">Nom</th>
                <th className="pb-3 font-semibold text-muted-foreground text-right">Semaines</th>
                <th className="pb-3 font-semibold text-muted-foreground text-right">H. totales</th>
                <th className="pb-3 font-semibold text-muted-foreground text-right">Moy. / sem.</th>
                <th className="pb-3 font-semibold text-muted-foreground text-right">Absences</th>
                <th className="pb-3 font-semibold text-muted-foreground text-right">Écart cumulé</th>
                <th className="pb-3 font-semibold text-muted-foreground text-right">Dernière activité</th>
              </tr>
            </thead>
            <tbody>
              {filtered.sort((a, b) => b.totalWeeks - a.totalWeeks).map((emp) => (
                <tr key={emp.name} className="border-b border-border/50 table-row-hover transition-colors">
                  <td className="py-2.5 font-medium">{emp.name}</td>
                  <td className="py-2.5 text-right font-mono-data">{emp.totalWeeks}</td>
                  <td className="py-2.5 text-right font-mono-data">{emp.totalHours.toLocaleString("fr-FR")}h</td>
                  <td className="py-2.5 text-right font-mono-data font-medium">{emp.avgHours.toFixed(1)}h</td>
                  <td className="py-2.5 text-right">
                    {emp.absences > 0 ? (
                      <span className="badge-warning">{emp.absences}</span>
                    ) : (
                      <span className="font-mono-data">0</span>
                    )}
                  </td>
                  <td className="py-2.5 text-right">
                    <span className={emp.totalDiff > 0 ? "badge-warning" : emp.totalDiff < 0 ? "badge-negative" : "badge-neutral"}>
                      {emp.totalDiff > 0 ? "+" : ""}{emp.totalDiff}h
                    </span>
                  </td>
                  <td className="py-2.5 text-right text-muted-foreground">
                    {emp.lastSeen
                      ? new Date(emp.lastSeen).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "2-digit" })
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
