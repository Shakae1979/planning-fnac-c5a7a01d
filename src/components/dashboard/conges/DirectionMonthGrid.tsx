import { useMemo } from "react";
import { CONGE_TYPES } from "../CongesCalendar";
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
}

export function DirectionMonthGrid({ year, month, employees, conges }: DirectionMonthGridProps) {
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

  let lastWeekShown = -1;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[11px] border-collapse">
        <thead>
          <tr className="border-b bg-muted/30">
            <th className="sticky left-0 bg-muted/30 px-1 py-1.5 text-left font-medium text-muted-foreground w-[70px] border-r z-10">
              {t("conges.date")}
            </th>
            <th className="px-1 py-1.5 text-left font-medium text-muted-foreground w-[30px] border-r">
              {t("conges.dayLabel")}
            </th>
            {sortedEmployees.map((emp) => (
              <th
                key={emp.id}
                className="px-1.5 py-1.5 text-center font-semibold text-foreground border-r last:border-r-0 min-w-[80px] bg-amber-50 dark:bg-amber-900/20 border-l-2 border-l-amber-300 dark:border-l-amber-700"
              >
                <div className="text-[10px] leading-tight truncate max-w-[90px]" title={[emp.name, emp.last_name].filter(Boolean).join(" ")}>
                  {emp.name}
                </div>
              </th>
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
            const schoolHol = getSchoolHolidayInfo(dateStr);
            const isoWeek = getISOWeek(date);
            const isMonday = jsDay === 1;
            const showWeek = isMonday && isoWeek !== lastWeekShown;
            if (showWeek) lastWeekShown = isoWeek;

            const dateLabel = `${String(day).padStart(2, "0")}-${monthShort(month)}`;

            const schoolBg =
              schoolHol && !isWeekend
                ? schoolHol.community === "both"
                  ? "bg-amber-400/15"
                  : schoolHol.community === "fr"
                  ? "bg-amber-300/10"
                  : "bg-sky-300/10"
                : "";

            return (
              <tr
                key={i}
                className={`border-b border-border/40 ${
                  holiday
                    ? "bg-emerald-500/15"
                    : schoolBg || (isWeekend ? "bg-muted/40" : "")
                } ${isMonday ? "border-t-2 border-t-accent/40" : ""}`}
              >
                <td className="sticky left-0 bg-card px-1 py-0.5 text-muted-foreground whitespace-nowrap border-r z-10">
                  <div className="flex items-center gap-1">
                    <span>{dateLabel}</span>
                    {showWeek && (
                      <span className="text-[9px] font-bold text-primary/60 ml-auto">
                        {isoWeek}
                      </span>
                    )}
                  </div>
                </td>
                <td
                  className={`px-1 py-0.5 font-medium border-r ${
                    isWeekend ? "text-muted-foreground/50" : ""
                  }`}
                >
                  {DAY_NAMES[jsDay]}
                </td>
                {holiday ? (
                  <td
                    colSpan={sortedEmployees.length}
                    className="px-2 py-0.5 text-center font-semibold text-emerald-700 dark:text-emerald-400 text-[10px]"
                  >
                    {holiday}
                  </td>
                ) : (
                  sortedEmployees.map((emp) => {
                    const leave = getLeaveForDate(emp.id, dateStr);
                    if (leave) {
                      const ct = congeTypes.find((c) => c.value === leave.type);
                      const typeColor = ct?.color ?? "bg-muted";
                      const typeLabel = ct?.label ?? leave.type;
                      return (
                        <td
                          key={emp.id}
                          className="px-0.5 py-0.5 text-center border-r last:border-r-0 border-l-2 border-l-amber-300/30 dark:border-l-amber-700/30"
                        >
                          <span
                            className={`${typeColor} text-white text-[9px] px-1 py-0.5 rounded block truncate`}
                            title={`${emp.name} — ${typeLabel}`}
                          >
                            {typeLabel.slice(0, 4)}
                          </span>
                        </td>
                      );
                    }
                    return (
                      <td
                        key={emp.id}
                        className="px-0.5 py-0.5 text-center border-r last:border-r-0 border-l-2 border-l-amber-300/30 dark:border-l-amber-700/30"
                      />
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
