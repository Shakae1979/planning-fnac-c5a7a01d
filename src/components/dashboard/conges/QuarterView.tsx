import { useMemo, useState } from "react";
import { CONGE_TYPES } from "../CongesCalendar";
import { isSchoolHoliday } from "@/lib/school-holidays";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

const MONTHS_SHORT = ["janv", "févr", "mars", "avr", "mai", "juin", "juil", "août", "sept", "oct", "nov", "déc"];
const MONTHS_FULL = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
const DAY_NAMES = ["dim", "lun", "mar", "mer", "jeu", "ven", "sam"];

const ROLE_COLUMNS = [
  { key: "responsable", label: "Resp." },
  { key: "technique", label: "Tech." },
  { key: "editorial", label: "Édit." },
  { key: "stock", label: "Stock" },
  { key: "caisse", label: "Caisse" },
];

// Belgian public holidays for 2026
const HOLIDAYS_2026: Record<string, string> = {
  "2026-01-01": "Nouvel An",
  "2026-04-05": "Pâques",
  "2026-04-06": "Lundi de Pâques",
  "2026-05-01": "Fête du travail",
  "2026-05-14": "Ascension",
  "2026-05-25": "Pentecôte",
  "2026-07-21": "Fête nationale",
  "2026-08-15": "Assomption",
  "2026-11-01": "Toussaint",
  "2026-11-11": "Armistice",
  "2026-12-25": "Noël",
};

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function formatDateStr(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function getISOWeek(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

interface QuarterViewProps {
  year: number;
  months: number[];
  employees: any[] | undefined;
  conges: any[] | undefined;
  deleteMutation: any;
}

function VerticalMonthColumn({ year, month, employees, conges, deleteMutation, onRequestDelete }: {
  year: number;
  month: number;
  employees: any[] | undefined;
  conges: any[] | undefined;
  deleteMutation: any;
  onRequestDelete: (target: { id: string; name: string; type: string }) => void;
}) {
  const daysInMonth = getDaysInMonth(year, month);

  const employeesByRole = useMemo(() => {
    const map: Record<string, any[]> = {};
    ROLE_COLUMNS.forEach(r => { map[r.key] = []; });
    employees?.forEach(emp => {
      if (map[emp.role]) map[emp.role].push(emp);
    });
    return map;
  }, [employees]);

  // Find active roles (those with at least one employee)
  const activeRoles = useMemo(() => {
    return ROLE_COLUMNS.filter(r => employeesByRole[r.key]?.length > 0);
  }, [employeesByRole]);

  const getLeaveForDate = (empId: string, dateStr: string) => {
    return conges?.find((c: any) => c.employee_id === empId && dateStr >= c.date_start && dateStr <= c.date_end);
  };

  const getLeavesForRoleOnDate = (role: string, dateStr: string) => {
    const emps = employeesByRole[role] || [];
    const results: { emp: any; leave: any }[] = [];
    emps.forEach(emp => {
      const leave = getLeaveForDate(emp.id, dateStr);
      if (leave) results.push({ emp, leave });
    });
    return results;
  };

  // Track week numbers already shown
  let lastWeekShown = -1;

  return (
    <div className="flex-1 min-w-0">
      <div className="text-sm font-bold text-center py-2 bg-muted/50 border-b">
        {MONTHS_FULL[month]}
      </div>
      <table className="w-full text-[11px] border-collapse">
        <thead>
          <tr className="border-b bg-muted/30">
            <th className="px-1 py-1 text-left font-medium text-muted-foreground w-[70px]">Date</th>
            <th className="px-1 py-1 text-left font-medium text-muted-foreground w-[30px]">Jour</th>
            {activeRoles.map(r => (
              <th key={r.key} className="px-1 py-1 text-center font-semibold text-muted-foreground">{r.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: daysInMonth }, (_, i) => {
            const day = i + 1;
            const date = new Date(year, month, day);
            const jsDay = date.getDay();
            const isWeekend = jsDay === 0 || jsDay === 6;
            const dateStr = formatDateStr(year, month, day);
            const holiday = HOLIDAYS_2026[dateStr];
            const schoolHol = isSchoolHoliday(dateStr);
            const isoWeek = getISOWeek(date);
            const isMonday = jsDay === 1;
            const showWeek = isMonday && isoWeek !== lastWeekShown;
            if (showWeek) lastWeekShown = isoWeek;

            const dateLabel = `${String(day).padStart(2, "0")}-${MONTHS_SHORT[month]}`;

            return (
              <tr
                key={i}
                className={`border-b border-border/40 ${
                  holiday ? "bg-emerald-500/15" : schoolHol && !isWeekend ? "bg-amber-400/15" : isWeekend ? "bg-muted/40" : ""
                } ${isMonday ? "border-t-2 border-t-accent/40" : ""}`}
              >
                <td className="px-1 py-0.5 text-muted-foreground whitespace-nowrap">
                  <div className="flex items-center gap-1">
                    <span>{dateLabel}</span>
                    {showWeek && (
                      <span className="text-[9px] font-bold text-primary/60 ml-auto">{isoWeek}</span>
                    )}
                  </div>
                </td>
                <td className={`px-1 py-0.5 font-medium ${isWeekend ? "text-muted-foreground/50" : ""}`}>
                  {DAY_NAMES[jsDay]}
                </td>
                {holiday ? (
                  <td colSpan={activeRoles.length} className="px-2 py-0.5 text-center font-semibold text-emerald-700 dark:text-emerald-400 text-[10px]">
                    {holiday}
                  </td>
                ) : (
                  activeRoles.map(role => {
                    const leaves = getLeavesForRoleOnDate(role.key, dateStr);
                    return (
                      <td key={role.key} className="px-1 py-0.5 text-center">
                        {leaves.length > 0 ? (
                          <div className="flex flex-col gap-0.5">
                            {leaves.map(({ emp, leave }) => {
                              const typeColor = CONGE_TYPES.find(t => t.value === leave.type)?.color ?? "bg-muted";
                              const typeLabel = CONGE_TYPES.find(t => t.value === leave.type)?.label ?? "";
                              return (
                                <span
                                  key={emp.id}
                                  className={`${typeColor} text-white text-[10px] px-1 py-0.5 rounded cursor-pointer truncate block`}
                                  title={`${emp.name} — ${typeLabel} — cliquer pour supprimer`}
                                  onClick={() => onRequestDelete({ id: leave.id, name: emp.name, type: typeLabel })}
                                >
                                  {emp.name.split(" ")[0]}
                                </span>
                              );
                            })}
                          </div>
                        ) : null}
                      </td>
                    );
                  })
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function QuarterView({ year, months, employees, conges, deleteMutation }: QuarterViewProps) {
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string; type: string } | null>(null);

  return (
    <div className="kpi-card overflow-hidden">
      <div className="overflow-x-auto">
        <div className="flex gap-0 divide-x divide-border min-w-[900px]">
          {months.map(m => (
            <VerticalMonthColumn
              key={m}
              year={year}
              month={m}
              employees={employees}
              conges={conges}
              deleteMutation={deleteMutation}
              onRequestDelete={setDeleteTarget}
            />
          ))}
        </div>
      </div>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce congé ?</AlertDialogTitle>
            <AlertDialogDescription>
              Voulez-vous vraiment supprimer le congé ({deleteTarget?.type}) de <strong>{deleteTarget?.name}</strong> ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (deleteTarget) { deleteMutation.mutate(deleteTarget.id); setDeleteTarget(null); } }}>
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
