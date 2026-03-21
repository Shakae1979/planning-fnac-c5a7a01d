import { useState } from "react";
import { CONGE_TYPES } from "../CongesCalendar";
import { isSchoolHoliday } from "@/lib/school-holidays";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function formatDate(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

interface MonthGridProps {
  year: number;
  month: number;
  employees: any[] | undefined;
  conges: any[] | undefined;
  deleteMutation: any;
}

export function MonthGrid({ year, month, employees, conges, deleteMutation }: MonthGridProps) {
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string; type: string } | null>(null);
  const MONTHS = [
    "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
    "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
  ];
  const daysInMonth = getDaysInMonth(year, month);

  const isOnLeave = (empId: string, dateStr: string) => {
    return conges?.find((c: any) => {
      if (c.employee_id !== empId) return false;
      return dateStr >= c.date_start && dateStr <= c.date_end;
    });
  };

  return (
    <div>
      <div className="text-xs font-semibold text-muted-foreground mb-1 text-center">
        {MONTHS[month]}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b">
              <th className="pb-0 pr-1 text-left font-semibold text-muted-foreground sticky left-0 bg-card z-10 min-w-[120px]"></th>
              {Array.from({ length: daysInMonth }, (_, i) => {
                const d = new Date(year, month, i + 1);
                const jsDay = d.getDay();
                const dayLetters = ["D", "L", "M", "M", "J", "V", "S"];
                const isWeekend = jsDay === 0 || jsDay === 6;
                const isMonday = jsDay === 1;
                const dateStr = formatDate(year, month, i + 1);
                const schoolHol = isSchoolHoliday(dateStr);
                return (
                  <th key={i} className={`pb-0 text-center text-[9px] font-normal min-w-[28px] ${schoolHol ? "bg-amber-400/20" : ""} ${isWeekend ? "text-muted-foreground/40" : "text-muted-foreground/70"} ${isMonday && i > 0 ? "border-l-2 border-accent/30" : ""}`}>
                    {dayLetters[jsDay]}
                  </th>
                );
              })}
              <th className="pb-0 min-w-[40px]"></th>
            </tr>
            <tr className="border-b">
              <th className="pb-1 pr-1 text-left font-semibold text-muted-foreground sticky left-0 bg-card z-10 min-w-[120px]">Vendeur</th>
              {Array.from({ length: daysInMonth }, (_, i) => {
                const d = new Date(year, month, i + 1);
                const jsDay = d.getDay();
                const isWeekend = jsDay === 0 || jsDay === 6;
                const isMonday = jsDay === 1;
                return (
                  <th key={i} className={`pb-1 text-center font-medium min-w-[28px] ${isWeekend ? "text-muted-foreground/50" : "text-muted-foreground"} ${isMonday && i > 0 ? "border-l-2 border-accent/30" : ""}`}>
                    {i + 1}
                  </th>
                );
              })}
              <th className="pb-1 text-center font-semibold text-muted-foreground min-w-[40px]">Total</th>
            </tr>
          </thead>
          <tbody>
            {employees?.map((emp) => {
              let totalDays = 0;
              return (
                <tr key={emp.id} className="border-b border-border/50">
                  <td className="py-0.5 pr-1 sticky left-0 bg-card z-10">
                    <div className="font-medium truncate">{emp.name}</div>
                  </td>
                  {Array.from({ length: daysInMonth }, (_, i) => {
                    const dateStr = formatDate(year, month, i + 1);
                    const leave = isOnLeave(emp.id, dateStr);
                    const d = new Date(year, month, i + 1);
                    const jsDay = d.getDay();
                    const isWeekend = jsDay === 0 || jsDay === 6;
                    const isMonday = jsDay === 1;
                    if (leave) totalDays++;
                    const typeColor = leave ? CONGE_TYPES.find((t) => t.value === leave.type)?.color ?? "bg-muted" : "";
                    return (
                      <td key={i} className={`py-0.5 text-center ${isWeekend ? "bg-muted/30" : ""} ${isMonday && i > 0 ? "border-l-2 border-accent/30" : ""}`}>
                        {leave ? (
                          <span className={`inline-block w-5 h-5 rounded ${typeColor} cursor-pointer`} title={`${CONGE_TYPES.find((t) => t.value === leave.type)?.label} — cliquer pour supprimer`} onClick={() => setDeleteTarget({ id: leave.id, name: emp.name, type: CONGE_TYPES.find((t) => t.value === leave.type)?.label || leave.type })} />
                        ) : null}
                      </td>
                    );
                  })}
                  <td className="py-0.5 text-center font-mono-data font-medium text-[10px]">{totalDays || "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
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
