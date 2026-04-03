import { useI18n } from "@/lib/i18n";
import { DirectionMonthGrid } from "./DirectionMonthGrid";

interface DirectionQuarterViewProps {
  year: number;
  months: number[];
  employees: any[] | undefined;
  conges: any[] | undefined;
}

export function DirectionQuarterView({ year, months, employees, conges }: DirectionQuarterViewProps) {
  const { monthName } = useI18n();

  return (
    <div className="kpi-card overflow-hidden">
      <div className="overflow-x-auto">
        <div className="flex gap-0 divide-x divide-border min-w-[900px]">
          {months.map((m) => (
            <div key={m} className="flex-1 min-w-0">
              <div className="text-sm font-bold text-center py-2 bg-muted/50 border-b">
                {monthName(m)}
              </div>
              <DirectionMonthGrid year={year} month={m} employees={employees} conges={conges} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
