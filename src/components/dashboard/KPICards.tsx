import { Clock, Users, TrendingUp, Target } from "lucide-react";
import type { WeekData } from "@/pages/Index";

interface KPICardsProps {
  current: WeekData;
  previous: WeekData | null;
}

export function KPICards({ current, previous }: KPICardsProps) {
  const totalHours = current.total_hours ?? 0;
  const prevHours = previous?.total_hours ?? totalHours;
  const hoursDiff = totalHours - prevHours;

  const employeeCount = current.employees.length;
  const prevEmpCount = previous?.employees.length ?? employeeCount;

  const etp = current.etp ?? 0;
  const budget = current.budget ?? 0;
  const etpDelta = budget ? etp - budget : 0;

  const overtimeEmployees = current.employees.filter((e) => e.diff !== 0);

  const cards = [
    {
      label: "Heures totales",
      value: totalHours,
      format: (v: number) => v.toLocaleString("fr-FR"),
      diff: hoursDiff,
      icon: Clock,
      color: "accent",
    },
    {
      label: "Collaborateurs",
      value: employeeCount,
      format: (v: number) => v.toString(),
      diff: employeeCount - prevEmpCount,
      icon: Users,
      color: "success",
    },
    {
      label: "ETP réel",
      value: etp,
      format: (v: number) => v.toFixed(2),
      diff: etpDelta,
      icon: TrendingUp,
      color: "warning",
      suffix: ` / ${budget}`,
    },
    {
      label: "Écarts horaires",
      value: overtimeEmployees.length,
      format: (v: number) => v.toString(),
      diff: null,
      icon: Target,
      color: overtimeEmployees.length > 0 ? "destructive" : "success",
      suffix: ` collaborateur${overtimeEmployees.length !== 1 ? "s" : ""}`,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {cards.map((card) => (
        <div key={card.label} className="kpi-card">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-muted-foreground">{card.label}</span>
            <card.icon className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono-data">{card.format(card.value)}</span>
            {card.suffix && <span className="text-sm text-muted-foreground">{card.suffix}</span>}
          </div>
          {card.diff !== null && card.diff !== 0 && (
            <div className="mt-2">
              <span className={card.diff > 0 ? "badge-positive" : card.diff < 0 ? "badge-negative" : "badge-neutral"}>
                {card.diff > 0 ? "+" : ""}{typeof card.diff === 'number' && Math.abs(card.diff) < 1 ? card.diff.toFixed(2) : card.diff}
                {" vs sem. préc."}
              </span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
