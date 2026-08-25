import { useState, useRef, useEffect, useMemo, forwardRef, useImperativeHandle } from "react";
import { Flag, Printer, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n";
import { getDisplayName } from "@/lib/format";
import { useStoreSettings, DAY_KEYS, timeToMin, type DayKey } from "@/hooks/useStoreSettings";
import { useStore } from "@/hooks/useStore";
import { ROLE_KEYS, ROLE_COLORS as CENTRAL_ROLE_COLORS, getRoleColors } from "@/lib/role-colors";
import { useAuth } from "@/hooks/useAuth";

export interface HourlyGridHandle {
  save: () => Promise<void>;
  canSave: boolean;
  saving: boolean;
}

function buildHalfHours(startMin: number, endMin: number) {
  const slots: { hour: number; minute: number; label: string }[] = [];
  for (let m = startMin; m < endMin; m += 30) {
    const hour = Math.floor(m / 60);
    const minute = m % 60;
    slots.push({ hour, minute, label: minute === 0 ? `${hour}h` : `${hour}h30` });
  }
  return slots;
}

function dayKeyFromDate(date: string): DayKey {
  const [y, m, d] = date.split("-").map(Number);
  const js = new Date(y, (m || 1) - 1, d || 1).getDay();
  return DAY_KEYS[js === 0 ? 6 : js - 1];
}

interface RoleLegendItem { key: string; color: string; dot: string; borderL: string }

/** Entrées spéciales qui ne sont pas de vrais métiers. */
const SPECIAL_ROLES: RoleLegendItem[] = [
  { key: "heure_de_table", color: "bg-transparent", dot: "bg-gray-300 border border-gray-400", borderL: "border-l-muted" },
  { key: "picking", color: "bg-cyan-500/80", dot: "bg-cyan-500", borderL: "border-l-cyan-500" },
];

/** Liste des rôles affichés (légende, sélecteur, couleurs) selon les réglages du magasin. */
function buildRoleList(multiRoles?: boolean | null, twoFloors?: boolean | null): RoleLegendItem[] {
  const base = [...ROLE_KEYS, ...getExtraRoleKeys(multiRoles, twoFloors)].map((key) => {
    const c = getRoleColors(key);
    return { key, color: c.barSoft, dot: c.dot, borderL: c.borderL };
  });
  return [...base, ...SPECIAL_ROLES];
}


interface Employee {
  id: string; name: string; role: string; start: string | null; end: string | null; hasShift: boolean; conge: any;
  breakStart?: string | null; breakEnd?: string | null;
  roleSegments?: { role: string; start: string; end: string }[];

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
      {multi && roleLabels.__applySelection && <div className="px-2 py-1 text-[10px] font-semibold text-primary border-b mb-1">{roleLabels.__applySelection}</div>}
      {ROLES.map((r) => (
        <button key={r.key} className="flex items-center gap-2 w-full px-2 py-1.5 text-xs rounded hover:bg-muted/80 transition-colors" onClick={() => onSelect(r.key)}>
          <span className={`w-3 h-3 rounded-full ${r.dot}`} />
          {roleLabels[r.key] || r.key}
        </button>
      ))}
    </div>
  );
}

const HourlyGrid = forwardRef<HourlyGridHandle, { employees: Employee[]; date: string; isFerie?: boolean; onStateChange?: (s: { canSave: boolean; saving: boolean }) => void }>(function HourlyGridImpl({ employees, date, isFerie = false, onStateChange }, ref) {
  const { t } = useI18n();
  const { dayHours } = useStoreSettings();
  const { currentStore } = useStore();
  const day = dayHours[dayKeyFromDate(date)];
  const dayRange = { startMin: timeToMin(day.start), endMin: timeToMin(day.end), closed: day.closed };
  const { role } = useAuth();
  const canEdit = role === "admin" || role === "editor" || role === "manager";
  const HALF_HOURS = useMemo(
    () => (dayRange.closed ? [] : buildHalfHours(dayRange.startMin, dayRange.endMin)),
    [dayRange.closed, dayRange.startMin, dayRange.endMin]
  );
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
      roleLabels[r.key] = t("hourlyGrid.lunchShort");
    } else if (r.key === "tresorerie") {
      roleLabels[r.key] = t("hourlyGrid.tresorerie");
    } else if (r.key === "picking") {
      roleLabels[r.key] = t("hourlyGrid.picking");
    } else {
      roleLabels[r.key] = t(`role.${r.key}.short` as any) || r.key;
    }
  });
  roleLabels.__applySelection = t("hourlyGrid.applySelection");

  const employeesKey = useMemo(
    () => employees.filter((e) => e.hasShift && !e.conge).map((e) => e.id).sort().join(","),
    [employees]
  );

  useEffect(() => {
    if (!date) return;
    const load = async () => {
      const [overridesRes, flagsRes] = await Promise.all([
        supabase.from("schedule_role_overrides").select("employee_id, slot_key, role").eq("date", date),
        supabase.from("employee_day_flags").select("employee_id, socloz, sav, comment").eq("date", date),
      ]);
      const loaded: Overrides = {};
      if (overridesRes.data) {
        for (const row of overridesRes.data) loaded[`${row.employee_id}-${row.slot_key}`] = row.role;
      }
      setOverrides(loaded);
      if (flagsRes.data && flagsRes.data.length > 0) {
        const comments: Record<string, string> = {};
        for (const row of flagsRes.data) { if ((row as any).comment) comments[row.employee_id] = (row as any).comment; }
        setEmpComments(comments);
      } else { setEmpComments({}); }
      setDirty(false);
    };
    load();
  }, [date, employeesKey]);

  // Derived lunch slot keys — visual overlay only, never written to DB.
  const lunchSlots = useMemo(() => {
    const set = new Set<string>();
    for (const emp of active) {
      const bs = emp.breakStart;
      const be = emp.breakEnd;
      if (!bs || !be) continue;
      const bsH = timeToHours(bs);
      const beH = timeToHours(be);
      for (const slot of HALF_HOURS) {
        const slotTime = slot.hour + slot.minute / 60;
        if (slotTime >= bsH && slotTime < beH) {
          set.add(`${emp.id}-${slot.hour}-${slot.minute}`);
        }
      }
    }
    return set;
  }, [active, HALF_HOURS]);

  const dirtyRef = useRef(dirty);
  dirtyRef.current = dirty;
  const handleSaveRef = useRef<() => Promise<void>>(async () => {});
  useImperativeHandle(ref, () => ({
    save: () => handleSaveRef.current(),
    canSave: canEdit && dirty && !saving,
    saving,
  }), [dirty, saving, canEdit]);
  useEffect(() => { onStateChange?.({ canSave: canEdit && dirty && !saving, saving }); }, [dirty, saving, onStateChange, canEdit]);

  if (active.length === 0 || dayRange.closed) return null;

  const handleCellClick = (empId: string, hour: number, e: React.MouseEvent, minute: number = 0) => {
    if (!canEdit) return;
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
    if (!canEdit || selected.size === 0) return;
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
  handleSaveRef.current = handleSave;


  return (
    <div className="mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("hourlyGrid.title")}</h2>
        <div className="flex items-center flex-wrap gap-2 sm:gap-3">
          <div className="flex items-center flex-wrap gap-1.5 sm:gap-2">
            {ROLES.map((r) => (
              <span key={r.key} className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <span className={`w-2.5 h-2.5 rounded-full ${r.dot}`} />
                {roleLabels[r.key]}
              </span>
            ))}
          </div>
          {canEdit && selected.size > 0 && (
            <Button size="sm" className="no-print h-7 text-xs gap-1.5" onClick={handleApplyClick}>
              {t("hourlyGrid.apply")} ({selected.size})
            </Button>
          )}
          <Button variant="outline" size="sm" className="no-print h-7 px-2 sm:px-3 text-xs gap-1.5" onClick={() => window.print()} title={t("action.print")} aria-label={t("action.print")}>
            <Printer className="h-3.5 w-3.5" /><span className="hidden sm:inline">{t("action.print")}</span>
          </Button>
        </div>
      </div>
      {isFerie && (
        <div className="mb-2 flex items-center gap-2 rounded-lg bg-gray-900 dark:bg-gray-100 px-3 py-1.5">
          <Flag className="h-3.5 w-3.5 text-white dark:text-gray-900" />
          <span className="text-xs font-bold uppercase tracking-wider text-white dark:text-gray-900">{t("schedule.holiday")}</span>
        </div>
      )}
      <div className={`overflow-x-auto rounded-lg border ${isFerie ? "opacity-60 grayscale" : ""}`}>
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="bg-muted/50">
              <th className="sticky left-0 bg-muted/50 px-2 py-1.5 text-left font-medium min-w-[88px] max-sm:landscape:min-w-[80px] sm:min-w-[100px] border-r">{t("hourlyGrid.employee")}</th>
              {HALF_HOURS.map((slot, i) => (
                <th key={i} className={`px-0 py-2 text-center font-medium min-w-[24px] max-sm:landscape:min-w-[26px] sm:min-w-[28px] ${slot.minute === 30 ? "border-r-2 border-r-foreground/30" : "border-r border-r-muted/40"} last:border-r-0`}>
                  <span className="text-[8px] sm:text-[9px]">{slot.minute === 0 ? slot.label : `${slot.hour}h30`}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {active.map((emp, idx) => {
              const empStart = timeToHours(emp.start);
              const empEnd = timeToHours(emp.end);
              const prevRole = idx > 0 ? active[idx - 1].role : null;
              const isFirstOfRole = prevRole !== emp.role;
              const borderL = ROLE_BORDER_L[emp.role] ? getRoleColors(emp.role).borderL : "border-l-muted";
              return (
                <tr key={emp.id} className={isFirstOfRole && idx > 0 ? "border-t-4 border-t-foreground/25" : "border-t"}>
                  <td className={`sticky left-0 bg-card px-2 py-1 border-r border-l-4 ${borderL}`}>
                    <div className="flex items-center gap-1.5">
                      <span className="font-medium truncate max-w-[72px] sm:max-w-[90px]">{getDisplayName(emp)}</span>
                      <span className="text-[9px] text-muted-foreground">{roleLabels[emp.role] || emp.role}</span>
                    </div>
                    {canEdit ? (
                      <Input
                        value={empComments[emp.id] || ""}
                        onChange={(e) => { setEmpComments((p) => ({ ...p, [emp.id]: e.target.value })); setDirty(true); }}
                        placeholder={t("hourlyGrid.note")}
                        className={`h-5 text-[9px] mt-0.5 px-1 py-0 border-muted bg-transparent ${!(empComments[emp.id]?.trim()) ? "print:hidden" : ""}`}
                      />
                    ) : (
                      empComments[emp.id]?.trim() ? (
                        <div className="text-[9px] mt-0.5 px-1 text-muted-foreground italic truncate">{empComments[emp.id]}</div>
                      ) : null
                    )}
                  </td>
                  {HALF_HOURS.map((slot, i) => {
                    const slotTime = slot.hour + slot.minute / 60;
                    const isWorking = empStart <= slotTime && empEnd > slotTime;
                    const overrideKey = `${emp.id}-${slot.hour}-${slot.minute}`;
                    const segRole = (emp.roleSegments || []).find(
                      (s) => timeToHours(s.start) <= slotTime && timeToHours(s.end) > slotTime
                    )?.role;
                    const cellRole = overrides[overrideKey]
                      || (lunchSlots.has(overrideKey) ? "heure_de_table" : (segRole || emp.role));
                    const colorClass = ROLE_KEYS.includes(cellRole as any)
                      ? getRoleColors(cellRole).barSoft
                      : (ROLE_BG[cellRole] || "bg-accent/20");

                    const isSelected = selected.has(overrideKey);
                    return (
                      <td key={i} className={`px-0 py-1 text-center ${slot.minute === 30 ? "border-r-2 border-r-foreground/30" : "border-r border-r-muted/40"} last:border-r-0 ${isWorking ? `${colorClass} ${canEdit ? "cursor-pointer hover:opacity-80 transition-opacity" : ""}` : ""} ${isSelected ? "ring-2 ring-inset ring-primary" : ""}`}
                        onClick={isWorking && canEdit ? (e) => handleCellClick(emp.id, slot.hour, e, slot.minute) : undefined}
                      >
                        {isWorking ? <div className={`w-full h-5 sm:h-6 rounded-sm ${isSelected ? "bg-primary/20" : ""}`} /> : null}
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
});

export default HourlyGrid;