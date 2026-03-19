import { formatTimeBE } from "@/lib/format";

const HOURS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];

const ROLE_COLORS: Record<string, string> = {
  responsable: "bg-primary/30",
  technique: "bg-accent/30",
  editorial: "bg-warning/30",
  stock: "bg-success/30",
  caisse: "bg-destructive/20",
};

const ROLE_LABELS: Record<string, string> = {
  responsable: "Resp.",
  technique: "Tech.",
  editorial: "Édit.",
  stock: "Stock",
  caisse: "Caisse",
};

interface Employee {
  id: string;
  name: string;
  role: string;
  start: string | null;
  end: string | null;
  hasShift: boolean;
  conge: any;
}

function timeToHours(t: string | null): number {
  if (!t) return 0;
  const [h, m] = t.split(":").map(Number);
  return h + (m || 0) / 60;
}

export default function HourlyGrid({ employees }: { employees: Employee[] }) {
  const active = employees.filter((e) => e.hasShift && !e.conge);
  if (active.length === 0) return null;

  return (
    <div className="mb-6">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
        Grille horaire
      </h2>
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-[11px] border-collapse">
          <thead>
            <tr className="bg-muted/50">
              <th className="sticky left-0 bg-muted/50 px-2 py-1.5 text-left font-medium min-w-[100px] border-r">
                Employé
              </th>
              {HOURS.map((h) => (
                <th key={h} className="px-0 py-1.5 text-center font-medium min-w-[32px] border-r last:border-r-0">
                  {h}h
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {active.map((emp) => {
              const empStart = timeToHours(emp.start);
              const empEnd = timeToHours(emp.end);
              const colorClass = ROLE_COLORS[emp.role] || "bg-accent/20";

              return (
                <tr key={emp.id} className="border-t">
                  <td className="sticky left-0 bg-card px-2 py-1 border-r">
                    <div className="flex items-center gap-1.5">
                      <span className="font-medium truncate max-w-[70px]">{emp.name}</span>
                      <span className="text-[9px] text-muted-foreground">
                        {ROLE_LABELS[emp.role] || emp.role}
                      </span>
                    </div>
                  </td>
                  {HOURS.map((h) => {
                    const isWorking = empStart <= h && empEnd > h;
                    return (
                      <td
                        key={h}
                        className={`px-0 py-1 text-center border-r last:border-r-0 ${
                          isWorking ? colorClass : ""
                        }`}
                      >
                        {isWorking ? (
                          <div className="w-full h-5 rounded-sm" />
                        ) : null}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
