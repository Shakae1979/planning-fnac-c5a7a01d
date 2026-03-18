import type { WeekData } from "@/pages/Index";
import { MessageSquare, Users } from "lucide-react";

interface Props {
  week: WeekData;
}

export function NotesPanel({ week }: Props) {
  return (
    <div className="space-y-4">
      <div className="kpi-card">
        <div className="flex items-center gap-2 mb-3">
          <MessageSquare className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold text-muted-foreground">Notes de la semaine</h3>
        </div>
        {week.notes ? (
          <p className="text-sm leading-relaxed">{week.notes}</p>
        ) : (
          <p className="text-sm text-muted-foreground italic">Aucune note pour cette semaine.</p>
        )}
      </div>

      {week.managers.length > 0 && (
        <div className="kpi-card">
          <div className="flex items-center gap-2 mb-3">
            <Users className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold text-muted-foreground">Responsables</h3>
          </div>
          <div className="space-y-2">
            {week.managers.map((mgr) => (
              <div key={mgr} className="text-sm font-medium">{mgr}</div>
            ))}
          </div>
        </div>
      )}

      <div className="kpi-card">
        <h3 className="text-sm font-semibold text-muted-foreground mb-3">Résumé rapide</h3>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-muted-foreground">Temps plein</span>
            <div className="font-mono-data font-bold text-lg">
              {week.employees.filter((e) => e.hb >= 35).length}
            </div>
          </div>
          <div>
            <span className="text-muted-foreground">Temps partiel</span>
            <div className="font-mono-data font-bold text-lg">
              {week.employees.filter((e) => e.hb > 0 && e.hb < 35).length}
            </div>
          </div>
          <div>
            <span className="text-muted-foreground">Absents</span>
            <div className="font-mono-data font-bold text-lg">
              {week.employees.filter((e) => e.hm === 0).length}
            </div>
          </div>
          <div>
            <span className="text-muted-foreground">Avec écart</span>
            <div className="font-mono-data font-bold text-lg">
              {week.employees.filter((e) => e.diff !== 0).length}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
