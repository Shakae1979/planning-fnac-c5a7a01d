import { useState, useMemo, useCallback } from "react";
import { CONGE_TYPES } from "../CongesCalendar";
import { isSchoolHoliday } from "@/lib/school-holidays";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { formatDateBE } from "@/lib/format";
import { useI18n, getHolidays2026, getDayNames } from "@/lib/i18n";

const ROLE_COLUMNS = [
  { key: "responsable", headerBg: "bg-red-100 dark:bg-red-900/30", borderColor: "border-l-2 border-l-red-300 dark:border-l-red-700" },
  { key: "technique", headerBg: "bg-orange-100 dark:bg-orange-900/30", borderColor: "border-l-2 border-l-orange-300 dark:border-l-orange-700" },
  { key: "editorial", headerBg: "bg-yellow-100 dark:bg-yellow-900/30", borderColor: "border-l-2 border-l-yellow-300 dark:border-l-yellow-700" },
  { key: "stock", headerBg: "bg-blue-100 dark:bg-blue-900/30", borderColor: "border-l-2 border-l-blue-300 dark:border-l-blue-700" },
  { key: "caisse", headerBg: "bg-green-100 dark:bg-green-900/30", borderColor: "border-l-2 border-l-green-300 dark:border-l-green-700" },
];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function formatDate(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function getISOWeek(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
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
  role: string;
  dates: string[];
}

export function MonthGrid({ year, month, employees, conges, deleteMutation, onAddConge }: MonthGridProps) {
  const { t, monthShort } = useI18n();
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string; type: string } | null>(null);
  const [selection, setSelection] = useState<Selection | null>(null);
  const [selectedEmpId, setSelectedEmpId] = useState<string | null>(null);
  const [showTypeDialog, setShowTypeDialog] = useState(false);
  const [selectedType, setSelectedType] = useState("conge");

  const HOLIDAYS = getHolidays2026(t);
  const DAY_NAMES = getDayNames(t);

  const roleLabels: Record<string, string> = {};
  ROLE_COLUMNS.forEach((r) => {
    roleLabels[r.key] = t(`role.${r.key}.short` as any) || r.key;
  });

  const congeTypes = CONGE_TYPES.map((ct) => ({
    ...ct,
    label: t(`leave.${ct.value}` as any),
  }));

  const daysInMonth = getDaysInMonth(year, month);

  const employeesByRole = useMemo(() => {
    const map: Record<string, any[]> = {};
    ROLE_COLUMNS.forEach(r => { map[r.key] = []; });
    employees?.forEach(emp => {
      if (map[emp.role]) map[emp.role].push(emp);
    });
    return map;
  }, [employees]);

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

  const handleCellClick = useCallback((role: string, dateStr: string) => {
    if (!selection || selection.role !== role) {
      setSelection({ role, dates: [dateStr] });
      setSelectedEmpId(null);
    } else {
      const dates = [...selection.dates];
      const idx = dates.indexOf(dateStr);
      if (idx >= 0) {
        dates.splice(idx, 1);
        if (dates.length === 0) { setSelection(null); return; }
        setSelection({ ...selection, dates });
      } else {
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

  const handleCancelSelection = () => {
    setSelection(null); setSelectedEmpId(null); setShowTypeDialog(false); setSelectedType("conge");
  };

  const handleConfirmSelection = () => {
    if (!selection || selection.dates.length === 0 || !selectedEmpId || !onAddConge) return;
    const sorted = [...selection.dates].sort();
    onAddConge(selectedEmpId, sorted[0], sorted[sorted.length - 1], selectedType);
    handleCancelSelection();
  };

  const selectionSorted = selection ? [...selection.dates].sort() : [];
  const selectionStart = selectionSorted[0];
  const selectionEnd = selectionSorted[selectionSorted.length - 1];
  const roleLabel = selection ? roleLabels[selection.role] || selection.role : "";
  const roleEmployees = selection ? employeesByRole[selection.role] || [] : [];

  let lastWeekShown = -1;

  return (
    <div>
      {selection && selection.dates.length > 0 && (
        <div className="flex items-center justify-between bg-primary/10 border border-primary/30 rounded-md px-3 py-1.5 mb-2 text-xs">
          <span>
            <strong>{roleLabel}</strong> — {selection.dates.length} {t("misc.dayOfWeek")}
            {selectionStart && selectionEnd && selectionStart !== selectionEnd && (
              <span className="text-muted-foreground ml-1">
                ({formatDateBE(new Date(selectionStart))} → {formatDateBE(new Date(selectionEnd))})
              </span>
            )}
          </span>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={handleCancelSelection}>{t("action.cancel")}</Button>
            <Button size="sm" className="h-6 text-xs" onClick={() => setShowTypeDialog(true)}>{t("conges.encodeLeave")}</Button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-[11px] border-collapse">
          <thead>
            <tr className="border-b bg-muted/30">
              <th className="px-1 py-1 text-left font-medium text-muted-foreground w-[70px]">{t("conges.date")}</th>
              <th className="px-1 py-1 text-left font-medium text-muted-foreground w-[30px]">{t("conges.dayLabel")}</th>
              {activeRoles.map(r => (
                <th key={r.key} className={`px-1 py-1.5 text-center font-semibold text-muted-foreground ${r.headerBg} ${r.borderColor}`}>{roleLabels[r.key]}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: daysInMonth }, (_, i) => {
              const day = i + 1;
              const date = new Date(year, month, day);
              const jsDay = date.getDay();
              const isWeekend = jsDay === 0 || jsDay === 6;
              const dateStr = formatDate(year, month, day);
              const holiday = HOLIDAYS[dateStr];
              const schoolHol = isSchoolHoliday(dateStr);
              const isoWeek = getISOWeek(date);
              const isMonday = jsDay === 1;
              const showWeek = isMonday && isoWeek !== lastWeekShown;
              if (showWeek) lastWeekShown = isoWeek;

              const dateLabel = `${String(day).padStart(2, "0")}-${monthShort(month)}`;

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
                      {showWeek && <span className="text-[9px] font-bold text-primary/60 ml-auto">{isoWeek}</span>}
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
                      const isSelected = selection?.role === role.key && selection.dates.includes(dateStr);
                      return (
                        <td
                          key={role.key}
                          className={`px-1 py-0.5 text-center cursor-pointer transition-colors ${role.borderColor} ${
                            isSelected ? "bg-primary/25 ring-1 ring-inset ring-primary/50" : "hover:bg-primary/10"
                          }`}
                          onClick={() => {
                            if (leaves.length > 0 && !isSelected) {
                              if (leaves.length === 1) {
                                const { emp, leave } = leaves[0];
                                const typeLabel = congeTypes.find(ct => ct.value === leave.type)?.label ?? "";
                                setDeleteTarget({ id: leave.id, name: emp.name, type: typeLabel });
                              }
                            } else {
                              handleCellClick(role.key, dateStr);
                            }
                          }}
                        >
                          {leaves.length > 0 ? (
                            <div className="flex flex-col gap-0.5">
                              {leaves.map(({ emp, leave }) => {
                                const typeColor = congeTypes.find(ct => ct.value === leave.type)?.color ?? "bg-muted";
                                const typeLabel = congeTypes.find(ct => ct.value === leave.type)?.label ?? "";
                                return (
                                  <span key={emp.id} className={`${typeColor} text-white text-[10px] px-1 py-0.5 rounded truncate block`} title={`${emp.name} — ${typeLabel}`}>
                                    {emp.name.split(" ")[0]}
                                  </span>
                                );
                              })}
                            </div>
                          ) : isSelected ? (
                            <span className="inline-block w-full h-4 rounded bg-primary/30" />
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

      <Dialog open={showTypeDialog} onOpenChange={(open) => { if (!open) setShowTypeDialog(false); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{t("conges.encodeLeave")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="text-sm text-muted-foreground">
              <strong>{roleLabel}</strong> — {selection?.dates.length} {t("misc.dayOfWeek")}
              {selectionStart && selectionEnd && (
                <span className="block text-xs mt-0.5">
                  {t("misc.from")} {formatDateBE(new Date(selectionStart))} {t("misc.to")} {formatDateBE(new Date(selectionEnd))}
                </span>
              )}
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{t("conges.seller")}</label>
              <select value={selectedEmpId || ""} onChange={(e) => setSelectedEmpId(e.target.value)} className="w-full px-3 py-2 text-sm rounded-md border bg-background">
                <option value="">{t("action.choose")}</option>
                {roleEmployees.map((emp: any) => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{t("conges.leaveType")}</label>
              <div className="grid grid-cols-2 gap-2">
                {congeTypes.map((ct) => (
                  <button
                    key={ct.value}
                    className={`flex items-center gap-2 px-3 py-2 rounded-md border text-sm transition-colors ${
                      selectedType === ct.value ? "border-primary bg-primary/10 font-medium" : "border-border hover:border-primary/50"
                    }`}
                    onClick={() => setSelectedType(ct.value)}
                  >
                    <span className={`inline-block w-3 h-3 rounded ${ct.color}`} />
                    {ct.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCancelSelection}>{t("action.cancel")}</Button>
            <Button onClick={handleConfirmSelection} disabled={!selectedEmpId}>{t("action.validate")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("conges.deleteLeave")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("conges.deleteConfirm")} ({deleteTarget?.type}) <strong>{deleteTarget?.name}</strong> ? {t("conges.irreversible")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("action.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (deleteTarget) { deleteMutation.mutate(deleteTarget.id); setDeleteTarget(null); } }}>
              {t("action.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
