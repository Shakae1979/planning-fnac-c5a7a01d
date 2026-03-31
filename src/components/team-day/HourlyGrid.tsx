import { useState, useRef, useEffect } from "react";
import { Printer, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n";

const HALF_HOURS: { hour: number; minute: number; label: string }[] = [];
for (let h = 9; h <= 19; h++) {
  HALF_HOURS.push({ hour: h, minute: 0, label: `${h}h` });
  HALF_HOURS.push({ hour: h, minute: 30, label: `${h}h30` });
}

const ROLES = [
  { key: "responsable", color: "bg-red-500/30", dot: "bg-red-500" },
  { key: "technique", color: "bg-orange-500/30", dot: "bg-orange-500" },
  { key: "editorial", color: "bg-yellow-500/30", dot: "bg-yellow-500" },
  { key: "stock", color: "bg-blue-500/30", dot: "bg-blue-500" },
  { key: "caisse", color: "bg-emerald-500/30", dot: "bg-emerald-500" },
  { key: "stagiaire", color: "bg-pink-500/30", dot: "bg-pink-500" },
  { key: "heure_de_table", color: "bg-transparent", dot: "bg-gray-300 border border-gray-400" },
];

const ROLE_BG: Record<string, string> = Object.fromEntries(ROLES.map((r) => [r.key, r.color]));

interface Employee {
  id: string; name: string; role: string; start: string | null; end: string | null; hasShift: boolean; conge: any;
}

function timeToHours(t: string | null): number {
  if (!t) return 0;
  const [h, m] = t.split(":").map(Number);
  return h + (m || 0) / 60;
}

type Overrides = Record<string, string>;

function RolePicker({ anchorRect, onSelect, onClose, roleLabels, multi }: {
  anchorRect: { top: number; left: number }; onSelect: (role: string) => void; onClose: () => void; roleLabels: Record<string, string>; multi?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) onClose(); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  return (
    <div ref={ref} className="fixed z-50 bg-card border rounded-lg shadow-lg p-1.5 min-w-[120px]" style={{ top: anchorRect.top, left: anchorRect.left }}>
      {multi && <div className="px-2 py-1 text-[10px] font-semibold text-primary border-b mb-1">Appliquer à la sélection</div>}
      {ROLES.map((r) => (
        <button key={r.key} className="flex items-center gap-2 w-full px-2 py-1.5 text-xs rounded hover:bg-muted/80 transition-colors" onClick={() => onSelect(r.key)}>
          <span className={`w-3 h-3 rounded-full ${r.dot}`} />
          {roleLabels[r.key] || r.key}
        </button>
      ))}
    </div>
  );
}

export default function HourlyGrid({ employees, date }: { employees: Employee[]; date: string }) {
  const { t } = useI18n();
  const active = employees.filter((e) => e.hasShift && !e.conge);
  const [overrides, setOverrides] = useState<Overrides>({});
  
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [empComments, setEmpComments] = useState<Record<string, string>>({});

  // Multi-select state
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [multiPicker, setMultiPicker] = useState<{ rect: { top: number; left: number } } | null>(null);

  const roleLabels: Record<string, string> = {};
  ROLES.forEach((r) => {
    if (r.key === "heure_de_table") {
      roleLabels[r.key] = "H. table";
    } else {
      roleLabels[r.key] = t(`role.${r.key}.short` as any) || r.key;
    }
  });

  useEffect(() => {
    if (!date) return;
    const load = async () => {
      const [overridesRes, flagsRes] = await Promise.all([
        supabase.from("schedule_role_overrides").select("employee_id, slot_key, role").eq("date", date),
        supabase.from("employee_day_flags").select("employee_id, socloz, sav").eq("date", date),
      ]);
      if (overridesRes.data && overridesRes.data.length > 0) {
        const loaded: Overrides = {};
        for (const row of overridesRes.data) loaded[`${row.employee_id}-${row.slot_key}`] = row.role;
        setOverrides(loaded);
      } else setOverrides({});
      if (flagsRes.data && flagsRes.data.length > 0) {
        const comments: Record<string, string> = {};
        for (const row of flagsRes.data) { if ((row as any).comment) comments[row.employee_id] = (row as any).comment; }
        setEmpComments(comments);
      } else { setEmpComments({}); }
      setDirty(false);
    };
    load();
  }, [date]);

  if (active.length === 0) return null;

  const handleCellClick = (empId: string, hour: number, e: React.MouseEvent, minute: number = 0) => {
    const key = `${empId}-${hour}-${minute}`;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };


  const handleMultiApply = (role: string) => {
    setOverrides((prev) => {
      const next = { ...prev };
      selected.forEach((key) => { next[key] = role; });
      return next;
    });
    setDirty(true);
    setSelected(new Set());
    setMultiPicker(null);
  };

  const handleApplyClick = (e: React.MouseEvent) => {
    if (selected.size === 0) return;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setMultiPicker({ rect: { top: rect.bottom + 2, left: rect.left } });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await Promise.all([
        supabase.from("schedule_role_overrides").delete().eq("date", date),
        supabase.from("employee_day_flags").delete().eq("date", date),
      ]);
      const rows = Object.entries(overrides).map(([key, role]) => {
        const parts = key.split("-");
        const slotKey = `${parts[parts.length - 2]}-${parts[parts.length - 1]}`;
        const employeeId = parts.slice(0, parts.length - 2).join("-");
        return { date, employee_id: employeeId, slot_key: slotKey, role };
      });
      const flagRows = Object.entries(empComments).filter(([, c]) => c.trim() !== '')
        .map(([employee_id, comment]) => ({ date, employee_id, socloz: false, sav: false, comment }));
      const promises: Array<Promise<any>> = [];
      if (rows.length > 0) promises.push(Promise.resolve(supabase.from("schedule_role_overrides").insert(rows)).then(({ error }) => { if (error) throw error; }));
      if (flagRows.length > 0) promises.push(Promise.resolve(supabase.from("employee_day_flags").insert(flagRows as any)).then(({ error }) => { if (error) throw error; }));
      await Promise.all(promises);
      setDirty(false);
      toast.success(t("misc.gridSaved"));
    } catch (err) {
      console.error(err);
      toast.error(t("misc.errorSaving"));
    } finally { setSaving(false); }
  };

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("hourlyGrid.title")}</h2>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            {ROLES.map((r) => (
              <span key={r.key} className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <span className={`w-2.5 h-2.5 rounded-full ${r.dot}`} />
                {roleLabels[r.key]}
              </span>
            ))}
          </div>
          {selected.size > 0 && (
            <Button size="sm" className="no-print h-7 text-xs gap-1.5" onClick={handleApplyClick}>
              Appliquer ({selected.size})
            </Button>
          )}
          <Button variant="outline" size="sm" className="no-print h-7 text-xs gap-1.5" onClick={() => window.print()}>
            <Printer className="h-3.5 w-3.5" />{t("action.print")}
          </Button>
          <Button size="sm" className="no-print h-7 text-xs gap-1.5" onClick={handleSave} disabled={saving || !dirty}>
            <Save className="h-3.5 w-3.5" />{saving ? t("hourlyGrid.saving") : t("action.save")}
          </Button>
        </div>
      </div>
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="bg-muted/50">
              <th className="sticky left-0 bg-muted/50 px-2 py-1.5 text-left font-medium min-w-[100px] border-r">{t("hourlyGrid.employee")}</th>
              {HALF_HOURS.map((slot, i) => (
                <th key={i} className={`px-0 py-2 text-center font-medium min-w-[28px] ${slot.minute === 30 ? "border-r-2 border-r-foreground/30" : "border-r border-r-muted/40"} last:border-r-0`}>
                  <span className="text-[9px]">{slot.minute === 0 ? slot.label : `${slot.hour}h30`}</span>
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
                      <span className="text-[9px] text-muted-foreground">{roleLabels[emp.role] || emp.role}</span>
                    </div>
                    <Input
                      value={empComments[emp.id] || ""}
                      onChange={(e) => { setEmpComments((p) => ({ ...p, [emp.id]: e.target.value })); setDirty(true); }}
                      placeholder="Note..."
                      className={`h-5 text-[9px] mt-0.5 px-1 py-0 border-muted bg-transparent ${!(empComments[emp.id]?.trim()) ? "print:hidden" : ""}`}
                    />
                  </td>
                  {HALF_HOURS.map((slot, i) => {
                    const slotTime = slot.hour + slot.minute / 60;
                    const isWorking = empStart <= slotTime && empEnd > slotTime;
                    const overrideKey = `${emp.id}-${slot.hour}-${slot.minute}`;
                    const cellRole = overrides[overrideKey] || emp.role;
                    const colorClass = ROLE_BG[cellRole] || "bg-accent/20";
                    const isSelected = selected.has(overrideKey);
                    return (
                      <td key={i} className={`px-0 py-1 text-center ${slot.minute === 30 ? "border-r-2 border-r-foreground/30" : "border-r border-r-muted/40"} last:border-r-0 ${isWorking ? `${colorClass} cursor-pointer hover:opacity-80 transition-opacity` : ""} ${isSelected ? "ring-2 ring-inset ring-primary" : ""}`}
                        onClick={isWorking ? (e) => handleCellClick(emp.id, slot.hour, e, slot.minute) : undefined}
                      >
                        {isWorking ? <div className={`w-full h-6 rounded-sm ${isSelected ? "bg-primary/20" : ""}`} /> : null}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      {multiPicker && <RolePicker anchorRect={multiPicker.rect} onSelect={handleMultiApply} onClose={() => setMultiPicker(null)} roleLabels={roleLabels} multi />}
    </div>
  );
}