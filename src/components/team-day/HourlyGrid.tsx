import { useState, useRef, useEffect } from "react";
import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

const HOURS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];

const ROLES = [
  { key: "responsable", label: "Resp.", color: "bg-red-300/50", dot: "bg-red-400" },
  { key: "technique", label: "Tech.", color: "bg-orange-300/50", dot: "bg-orange-400" },
  { key: "editorial", label: "Édit.", color: "bg-yellow-300/50", dot: "bg-yellow-400" },
  { key: "stock", label: "Stock", color: "bg-blue-300/50", dot: "bg-blue-400" },
  { key: "caisse", label: "Caisse", color: "bg-emerald-300/50", dot: "bg-emerald-400" },
  { key: "heure_de_table", label: "H. table", color: "bg-transparent", dot: "bg-gray-300 border border-gray-400" },
];

const ROLE_BG: Record<string, string> = Object.fromEntries(ROLES.map((r) => [r.key, r.color]));

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

// Key for overrides: "empId-hour"
type Overrides = Record<string, string>;

function RolePicker({
  anchorRect,
  onSelect,
  onClose,
}: {
  anchorRect: { top: number; left: number };
  onSelect: (role: string) => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="fixed z-50 bg-card border rounded-lg shadow-lg p-1.5 min-w-[120px]"
      style={{ top: anchorRect.top, left: anchorRect.left }}
    >
      {ROLES.map((r) => (
        <button
          key={r.key}
          className="flex items-center gap-2 w-full px-2 py-1.5 text-xs rounded hover:bg-muted/80 transition-colors"
          onClick={() => onSelect(r.key)}
        >
          <span className={`w-3 h-3 rounded-full ${r.dot}`} />
          {r.label}
        </button>
      ))}
    </div>
  );
}

export default function HourlyGrid({ employees }: { employees: Employee[] }) {
  const active = employees.filter((e) => e.hasShift && !e.conge);
  const [overrides, setOverrides] = useState<Overrides>({});
  const [picker, setPicker] = useState<{ key: string; rect: { top: number; left: number } } | null>(null);

  if (active.length === 0) return null;

  const handleCellClick = (empId: string, hour: number, e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setPicker({ key: `${empId}-${hour}`, rect: { top: rect.bottom + 2, left: rect.left } });
  };

  const handleSelect = (role: string) => {
    if (!picker) return;
    setOverrides((prev) => ({ ...prev, [picker.key]: role }));
    setPicker(null);
  };

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Grille horaire
        </h2>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 no-print">
          {ROLES.map((r) => (
            <span key={r.key} className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <span className={`w-2.5 h-2.5 rounded-full ${r.dot}`} />
              {r.label}
            </span>
          ))}
        </div>
      </div>
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
                    const overrideKey = `${emp.id}-${h}`;
                    const cellRole = overrides[overrideKey] || emp.role;
                    const colorClass = ROLE_BG[cellRole] || "bg-accent/20";

                    return (
                      <td
                        key={h}
                        className={`px-0 py-1 text-center border-r last:border-r-0 ${
                          isWorking ? `${colorClass} cursor-pointer hover:opacity-80 transition-opacity` : ""
                        }`}
                        onClick={isWorking ? (e) => handleCellClick(emp.id, h, e) : undefined}
                      >
                        {isWorking ? <div className="w-full h-5 rounded-sm" /> : null}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {picker && (
        <RolePicker
          anchorRect={picker.rect}
          onSelect={handleSelect}
          onClose={() => setPicker(null)}
        />
      )}
    </div>
  );
}
