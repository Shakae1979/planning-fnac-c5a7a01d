import type { WeekData } from "@/pages/Index";
import { ArrowUp, ArrowDown, Minus } from "lucide-react";

interface Props {
  week: WeekData;
}

export function EmployeeTable({ week }: Props) {
  const sorted = [...week.employees].sort((a, b) => b.hm - a.hm);

  return (
    <div className="kpi-card overflow-hidden">
      <h3 className="text-sm font-semibold text-muted-foreground mb-4">
        Détail par collaborateur — {week.sheet}
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left">
              <th className="pb-3 font-semibold text-muted-foreground">Nom</th>
              <th className="pb-3 font-semibold text-muted-foreground text-right">H. de base</th>
              <th className="pb-3 font-semibold text-muted-foreground text-right">H. modifiées</th>
              <th className="pb-3 font-semibold text-muted-foreground text-right">Écart</th>
              <th className="pb-3 font-semibold text-muted-foreground text-right">Statut</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((emp) => (
              <tr key={emp.name} className="border-b border-border/50 table-row-hover transition-colors">
                <td className="py-2.5 font-medium">{emp.name}</td>
                <td className="py-2.5 text-right font-mono-data">{emp.hb}h</td>
                <td className="py-2.5 text-right font-mono-data font-medium">{emp.hm}h</td>
                <td className="py-2.5 text-right">
                  <span className="font-mono-data">
                    {emp.diff > 0 ? `+${emp.diff}` : emp.diff === 0 ? "0" : emp.diff}h
                  </span>
                </td>
                <td className="py-2.5 text-right">
                  {emp.diff > 0 ? (
                    <span className="badge-warning inline-flex items-center gap-1">
                      <ArrowUp className="h-3 w-3" /> Heures sup.
                    </span>
                  ) : emp.diff < 0 ? (
                    <span className="badge-negative inline-flex items-center gap-1">
                      <ArrowDown className="h-3 w-3" /> Sous-heures
                    </span>
                  ) : emp.hm === 0 ? (
                    <span className="badge-neutral">Absent</span>
                  ) : (
                    <span className="badge-positive inline-flex items-center gap-1">
                      <Minus className="h-3 w-3" /> Conforme
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
