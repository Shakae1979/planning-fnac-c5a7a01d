import { useState, useCallback } from "react";
import { CONGE_TYPES } from "../CongesCalendar";
import { isSchoolHoliday } from "@/lib/school-holidays";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { formatDateBE } from "@/lib/format";

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
  onAddConge?: (employeeId: string, dateStart: string, dateEnd: string, type: string) => void;
}

interface Selection {
  empId: string;
  empName: string;
  dates: string[];
}

export function MonthGrid({ year, month, employees, conges, deleteMutation, onAddConge }: MonthGridProps) {
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string; type: string } | null>(null);
  const [selection, setSelection] = useState<Selection | null>(null);
  const [showTypeDialog, setShowTypeDialog] = useState(false);
  const [selectedType, setSelectedType] = useState("conge");

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

  const handleCellClick = useCallback((empId: string, empName: string, dateStr: string) => {
    if (!selection || selection.empId !== empId) {
      // Start new selection
      setSelection({ empId, empName, dates: [dateStr] });
    } else {
      // Same employee — extend/toggle selection
      const dates = [...selection.dates];
      const idx = dates.indexOf(dateStr);
      if (idx >= 0) {
        dates.splice(idx, 1);
        if (dates.length === 0) {
          setSelection(null);
          return;
        }
        setSelection({ ...selection, dates });
      } else {
        // Build range from first selected to this date
        const allDates = [dates[0], dateStr].sort();
        const start = allDates[0];
        const end = allDates[allDates.length - 1];
        const range: string[] = [];
        const startDate = new Date(start);
        const endDate = new Date(end);
        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
          range.push(d.toISOString().slice(0, 10));
        }
        setSelection({ ...selection, dates: range });
      }
    }
  }, [selection]);

  const handleConfirmSelection = () => {
    if (!selection || selection.dates.length === 0 || !onAddConge) return;
    const sorted = [...selection.dates].sort();
    onAddConge(selection.empId, sorted[0], sorted[sorted.length - 1], selectedType);
    setSelection(null);
    setShowTypeDialog(false);
    setSelectedType("conge");
  };

  const handleCancelSelection = () => {
    setSelection(null);
    setShowTypeDialog(false);
    setSelectedType("conge");
  };

  const isSelected = (empId: string, dateStr: string) => {
    return selection?.empId === empId && selection.dates.includes(dateStr);
  };

  const selectionSorted = selection ? [...selection.dates].sort() : [];
  const selectionStart = selectionSorted[0];
  const selectionEnd = selectionSorted[selectionSorted.length - 1];

  return (
    <div>
      <div className="text-xs font-semibold text-muted-foreground mb-1 text-center">
        {MONTHS[month]}
      </div>

      {/* Selection bar */}
      {selection && selection.dates.length > 0 && (
        <div className="flex items-center justify-between bg-primary/10 border border-primary/30 rounded-md px-3 py-1.5 mb-2 text-xs">
          <span>
            <strong>{selection.empName}</strong> — {selection.dates.length} jour(s) sélectionné(s)
            {selectionStart && selectionEnd && selectionStart !== selectionEnd && (
              <span className="text-muted-foreground ml-1">
                ({formatDateBE(new Date(selectionStart))} → {formatDateBE(new Date(selectionEnd))})
              </span>
            )}
          </span>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={handleCancelSelection}>
              Annuler
            </Button>
            <Button size="sm" className="h-6 text-xs" onClick={() => setShowTypeDialog(true)}>
              Encoder le congé
            </Button>
          </div>
        </div>
      )}

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
                const dateStr = formatDate(year, month, i + 1);
                const schoolHol = isSchoolHoliday(dateStr);
                return (
                  <th key={i} className={`pb-1 text-center font-medium min-w-[28px] ${schoolHol ? "bg-amber-400/20" : ""} ${isWeekend ? "text-muted-foreground/50" : "text-muted-foreground"} ${isMonday && i > 0 ? "border-l-2 border-accent/30" : ""}`} title={schoolHol || undefined}>
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
                    const schoolHol = isSchoolHoliday(dateStr);
                    const selected = isSelected(emp.id, dateStr);
                    return (
                      <td
                        key={i}
                        className={`py-0.5 text-center cursor-pointer transition-colors ${
                          selected
                            ? "bg-primary/25 ring-1 ring-inset ring-primary/50"
                            : schoolHol && !isWeekend
                            ? "bg-amber-400/20"
                            : isWeekend
                            ? "bg-muted/30"
                            : "hover:bg-primary/10"
                        } ${isMonday && i > 0 ? "border-l-2 border-accent/30" : ""}`}
                        onClick={() => {
                          if (leave) {
                            setDeleteTarget({ id: leave.id, name: emp.name, type: CONGE_TYPES.find((t) => t.value === leave.type)?.label || leave.type });
                          } else {
                            handleCellClick(emp.id, emp.name, dateStr);
                          }
                        }}
                      >
                        {leave ? (
                          <span className={`inline-block w-5 h-5 rounded ${typeColor}`} title={`${CONGE_TYPES.find((t) => t.value === leave.type)?.label} — cliquer pour supprimer`} />
                        ) : selected ? (
                          <span className="inline-block w-5 h-5 rounded bg-primary/40" />
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

      {/* Type selection dialog */}
      <Dialog open={showTypeDialog} onOpenChange={(open) => { if (!open) setShowTypeDialog(false); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Encoder un congé</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="text-sm text-muted-foreground">
              <strong>{selection?.empName}</strong> — {selection?.dates.length} jour(s)
              {selectionStart && selectionEnd && (
                <span className="block text-xs mt-0.5">
                  Du {formatDateBE(new Date(selectionStart))} au {formatDateBE(new Date(selectionEnd))}
                </span>
              )}
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Type de congé</label>
              <div className="grid grid-cols-2 gap-2">
                {CONGE_TYPES.map((t) => (
                  <button
                    key={t.value}
                    className={`flex items-center gap-2 px-3 py-2 rounded-md border text-sm transition-colors ${
                      selectedType === t.value
                        ? "border-primary bg-primary/10 font-medium"
                        : "border-border hover:border-primary/50"
                    }`}
                    onClick={() => setSelectedType(t.value)}
                  >
                    <span className={`inline-block w-3 h-3 rounded ${t.color}`} />
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCancelSelection}>Annuler</Button>
            <Button onClick={handleConfirmSelection}>Valider</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
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
