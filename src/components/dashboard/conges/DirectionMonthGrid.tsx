import { useState, useMemo } from "react";
import { CONGE_TYPES } from "../CongesCalendar";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDateBE, formatLocalDate, getDisplayName } from "@/lib/format";
import { getSchoolHolidayInfo } from "@/lib/school-holidays";
import { useI18n, getHolidays2026, getDayNames } from "@/lib/i18n";

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

interface DirectionMonthGridProps {
  year: number;
  month: number;
  employees: any[] | undefined;
  conges: any[] | undefined;
  managerStoreNames?: Record<string, string>;
  deleteMutation?: any;
  onAddConge?: (employeeId: string, dateStart: string, dateEnd: string, type: string) => void;
}

export function DirectionMonthGrid({ year, month, employees, conges, managerStoreNames = {}, deleteMutation, onAddConge }: DirectionMonthGridProps) {
  const { t, monthShort } = useI18n();
  const HOLIDAYS = getHolidays2026(t);
  const DAY_NAMES = getDayNames(t);

  const congeTypes = CONGE_TYPES.map((ct) => ({
    ...ct,
    label: t(`leave.${ct.value}` as any),
  }));

  const daysInMonth = getDaysInMonth(year, month);
  const sortedEmployees = useMemo(() => {
    if (!employees) return [];
    return [...employees].sort((a, b) => {
      const nameA = [a.name, a.last_name].filter(Boolean).join(" ");
      const nameB = [b.name, b.last_name].filter(Boolean).join(" ");
      return nameA.localeCompare(nameB, "fr");
    });
  }, [employees]);

  const getLeaveForDate = (empId: string, dateStr: string) => {
    return conges?.find(
      (c: any) => c.employee_id === empId && dateStr >= c.date_start && dateStr <= c.date_end
    );
  };

  const isEditable = !!deleteMutation || !!onAddConge;
  const [confirmDelete, setConfirmDelete] = useState<any>(null);
  const [addDialog, setAddDialog] = useState<{ empId: string; date: string } | null>(null);
  const [addType, setAddType] = useState("conge");
  const [addStart, setAddStart] = useState<Date | undefined>();
  const [addEnd, setAddEnd] = useState<Date | undefined>();

  const handleCellClick = (empId: string, dateStr: string, isWeekend: boolean) => {
    if (!isEditable || isWeekend) return;
    const leave = getLeaveForDate(empId, dateStr);
    if (leave && deleteMutation) {
      setConfirmDelete(leave);
    } else if (!leave && onAddConge) {
      const clickedDate = new Date(dateStr + "T00:00:00");
      setAddDialog({ empId, date: dateStr });
      setAddType("conge");
      setAddStart(clickedDate);
      setAddEnd(clickedDate);
    }
  };

  // Build day metadata array
  const days = useMemo(() => {
    let lastWeek = -1;
    return Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1;
      const date = new Date(year, month, day);
      const jsDay = date.getDay();
      const isWeekend = jsDay === 0 || jsDay === 6;
      const dateStr = formatDate(year, month, day);
      const holiday = HOLIDAYS[dateStr];
      const schoolHol = getSchoolHolidayInfo(dateStr);
      const isoWeek = getISOWeek(date);
      const isMonday = jsDay === 1;
      const showWeek = isMonday && isoWeek !== lastWeek;
      if (showWeek) lastWeek = isoWeek;
      return { day, date, jsDay, isWeekend, dateStr, holiday, schoolHol, isoWeek, isMonday, showWeek };
    });
  }, [year, month, daysInMonth, HOLIDAYS]);

  // Horizontal layout: employees as rows, days as columns
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs border-collapse table-fixed">
        <thead>
          <tr className="border-b bg-muted/30">
            <th className="sticky left-0 bg-muted/30 px-2 py-1.5 text-left font-medium text-muted-foreground w-[120px] min-w-[120px] border-r z-10">
            </th>
            {days.map((d) => {
              const schoolBg =
                d.schoolHol && !d.isWeekend
                  ? d.schoolHol.community === "both"
                    ? "bg-amber-400/15"
                    : d.schoolHol.community === "fr"
                    ? "bg-amber-300/10"
                    : "bg-sky-300/10"
                  : "";
              return (
                <th
                  key={d.day}
                  className={`px-0 py-1.5 text-center font-medium border-r last:border-r-0 ${
                    d.holiday
                      ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                      : d.isWeekend
                      ? "bg-muted/40 text-muted-foreground/50"
                      : schoolBg
                  } ${d.isMonday ? "border-l-2 border-l-accent/40" : ""}`}
                  title={d.holiday || `${String(d.day).padStart(2, "0")} ${monthShort(month)}`}
                >
                  <div className="text-[10px] leading-tight font-bold">{d.day}</div>
                  <div className={`text-[9px] leading-tight ${d.isWeekend ? "text-muted-foreground/40" : "text-muted-foreground"}`}>
                    {DAY_NAMES[d.jsDay]}
                  </div>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {sortedEmployees.map((emp) => (
            <tr key={emp.id} className="border-b border-border/40 hover:bg-accent/5">
              <td className="sticky left-0 bg-card px-2 py-1.5 border-r z-10 whitespace-nowrap">
                <div className="font-semibold text-foreground text-xs truncate" title={[emp.name, emp.last_name].filter(Boolean).join(" ")}>
                  {emp.name}
                </div>
                {managerStoreNames[emp.id] && (
                  <div className="text-[9px] text-muted-foreground truncate" title={managerStoreNames[emp.id]}>
                    {managerStoreNames[emp.id]}
                  </div>
                )}
              </td>
              {days.map((d) => {
                const leave = getLeaveForDate(emp.id, d.dateStr);
                const schoolBg =
                  d.schoolHol && !d.isWeekend
                    ? d.schoolHol.community === "both"
                      ? "bg-amber-400/15"
                      : d.schoolHol.community === "fr"
                      ? "bg-amber-300/10"
                      : "bg-sky-300/10"
                    : "";

                if (d.holiday) {
                  return (
                    <td
                      key={d.day}
                      className="px-0 py-1 text-center border-r last:border-r-0 bg-emerald-500/15"
                      title={d.holiday}
                    >
                      <span className="text-emerald-600 dark:text-emerald-400 text-[10px]">●</span>
                    </td>
                  );
                }

                if (leave) {
                  const ct = congeTypes.find((c) => c.value === leave.type);
                  const typeColor = ct?.color ?? "bg-muted";
                  const typeLabel = ct?.label ?? leave.type;
                  return (
                    <td
                      key={d.day}
                      className={`px-0 py-0.5 text-center border-r last:border-r-0 ${d.isMonday ? "border-l-2 border-l-accent/40" : ""} ${isEditable ? "cursor-pointer hover:bg-destructive/10" : ""}`}
                      onClick={() => handleCellClick(emp.id, d.dateStr, d.isWeekend)}
                      title={`${emp.name} — ${typeLabel}`}
                    >
                      <span className={`${typeColor} text-white text-[9px] px-0.5 py-0.5 rounded block mx-auto w-[26px] leading-tight font-medium`}>
                        {typeLabel.slice(0, 3)}
                      </span>
                    </td>
                  );
                }

                return (
                  <td
                    key={d.day}
                    className={`px-0 py-1 text-center border-r last:border-r-0 ${
                      d.isWeekend ? "bg-muted/40" : schoolBg
                    } ${d.isMonday ? "border-l-2 border-l-accent/40" : ""} ${isEditable && !d.isWeekend ? "cursor-pointer hover:bg-accent/30" : ""}`}
                    onClick={() => handleCellClick(emp.id, d.dateStr, d.isWeekend)}
                  />
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>

      {confirmDelete && (
        <AlertDialog open onOpenChange={() => setConfirmDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t("conges.deleteLeave")}</AlertDialogTitle>
              <AlertDialogDescription>
                {t("conges.deleteConfirm")} ({confirmDelete?.type}) ? {t("conges.irreversible")}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t("action.cancel")}</AlertDialogCancel>
              <AlertDialogAction onClick={() => { deleteMutation?.mutate(confirmDelete.id); setConfirmDelete(null); }}>
                {t("action.delete")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {addDialog && (
        <Dialog open onOpenChange={() => setAddDialog(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("conges.addLeave")}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <label className="text-sm text-muted-foreground">{t("conges.start")}</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("mt-1 w-full justify-start text-left font-normal", !addStart && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                      {addStart ? formatDateBE(addStart) : t("action.choose")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={addStart} onSelect={setAddStart} weekStartsOn={1} initialFocus className="p-3 pointer-events-auto" />
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <label className="text-sm text-muted-foreground">{t("conges.end")}</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("mt-1 w-full justify-start text-left font-normal", !addEnd && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                      {addEnd ? formatDateBE(addEnd) : t("action.choose")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={addEnd} onSelect={setAddEnd} weekStartsOn={1} disabled={(date) => addStart ? date < addStart : false} initialFocus className="p-3 pointer-events-auto" />
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <label className="text-sm text-muted-foreground">{t("conges.type")}</label>
                <select value={addType} onChange={(e) => setAddType(e.target.value)} className="w-full mt-1 px-3 py-2 text-sm rounded-md border bg-background">
                  {congeTypes.map((ct) => <option key={ct.value} value={ct.value}>{ct.label}</option>)}
                </select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddDialog(null)}>{t("action.cancel")}</Button>
              <Button
                disabled={!addStart || !addEnd}
                onClick={() => {
                  if (addStart && addEnd) {
                    onAddConge?.(addDialog.empId, formatLocalDate(addStart), formatLocalDate(addEnd), addType);
                    setAddDialog(null);
                  }
                }}
              >
                {t("action.validate")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
