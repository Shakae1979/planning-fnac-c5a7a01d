import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle2, CalendarOff, Gauge, Users2, GripVertical, Scale } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { formatDateBE, formatLocalDate, getDisplayName } from "@/lib/format";

type Employee = { id: string; name: string; last_name?: string | null; role: string; contract_hours: number; is_cadre?: boolean };
type Schedule = Record<string, any> & { employee_id: string };

type Props = {
  employees: Employee[];
  schedules: Schedule[];
  coverage: Record<string, Record<number, { name: string; role: string }[]>>;
  dayKeys: readonly string[];
  weekMonday: Date;
};

const CRITICAL_ROLES = ["responsable", "caisse"] as const;
const ALERT_HOURS = Array.from({ length: 12 }, (_, i) => i + 9); // 9-20h
const ROLE_ORDER = ["responsable", "technique", "editorial", "stock", "caisse", "stagiaire"] as const;

type CardId = "alerts" | "leaves" | "occupancy" | "etp" | "byDept";
const DEFAULT_ORDER: CardId[] = ["alerts", "leaves", "occupancy", "etp", "byDept"];
const STORAGE_KEY = "overview-insights-order-v1";
const CARD_SPAN: Record<CardId, string> = {
  alerts: "lg:col-span-1",
  leaves: "lg:col-span-1",
  occupancy: "lg:col-span-1",
  etp: "lg:col-span-1",
  byDept: "lg:col-span-1",
};

const FTE_BASE = 36;

function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

export function OverviewInsights({ employees, schedules, coverage, dayKeys, weekMonday }: Props) {
  const { t } = useI18n();

  // ---- Persisted card order ----
  const [order, setOrder] = useState<CardId[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return DEFAULT_ORDER;
      const parsed = JSON.parse(raw) as CardId[];
      const valid = parsed.filter((x): x is CardId => DEFAULT_ORDER.includes(x as CardId));
      const missing = DEFAULT_ORDER.filter((x) => !valid.includes(x));
      return [...valid, ...missing];
    } catch {
      return DEFAULT_ORDER;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(order));
    } catch {}
  }, [order]);
  const [dragId, setDragId] = useState<CardId | null>(null);
  const [overId, setOverId] = useState<CardId | null>(null);

  const moveCard = (from: CardId, to: CardId) => {
    if (from === to) return;
    setOrder((prev) => {
      const next = prev.filter((x) => x !== from);
      const idx = next.indexOf(to);
      next.splice(idx, 0, from);
      return next;
    });
  };

  // ---- Occupation (global + per rayon) ----
  const totalContract = employees.reduce((s, e) => s + Number(e.contract_hours || 0), 0);
  const plannedByEmp = new Map<string, number>();
  for (const sc of schedules as any[]) {
    const h = Number(sc.hours_modified ?? sc.hours_base ?? 0);
    plannedByEmp.set(sc.employee_id, (plannedByEmp.get(sc.employee_id) ?? 0) + h);
  }
  const totalPlanned = Array.from(plannedByEmp.values()).reduce((s, v) => s + v, 0);
  const occupancy = totalContract > 0 ? Math.round((totalPlanned / totalContract) * 100) : 0;
  const diffHours = totalPlanned - totalContract;

  const occupancyByRole = ROLE_ORDER.map((role) => {
    const emps = employees.filter((e) => e.role === role);
    const contract = emps.reduce((s, e) => s + Number(e.contract_hours || 0), 0);
    const planned = emps.reduce((s, e) => s + (plannedByEmp.get(e.id) ?? 0), 0);
    const pct = contract > 0 ? Math.round((planned / contract) * 100) : 0;
    return { role, contract, planned, pct, count: emps.length };
  }).filter((r) => r.count > 0);

  // ---- Unplanned employees (full list, sorted by role hierarchy) ----
  const scheduledIds = new Set(schedules.map((s) => s.employee_id));
  const unplanned = employees
    .filter((e) => !scheduledIds.has(e.id))
    .sort((a, b) => {
      const ra = ROLE_ORDER.indexOf(a.role as any);
      const rb = ROLE_ORDER.indexOf(b.role as any);
      const oa = ra === -1 ? 999 : ra;
      const ob = rb === -1 ? 999 : rb;
      if (oa !== ob) return oa - ob;
      const soA = (a as any).sort_order ?? 0;
      const soB = (b as any).sort_order ?? 0;
      if (soA !== soB) return soA - soB;
      return getDisplayName(a as any).localeCompare(getDisplayName(b as any), "fr");
    });

  // ---- Headcount per department ----
  const headcountByRole = ROLE_ORDER.map((role) => ({
    role,
    total: employees.filter((e) => e.role === role).length,
    planned: employees.filter((e) => e.role === role && scheduledIds.has(e.id)).length,
  })).filter((r) => r.total > 0);

  // ---- Alerts ----
  type Alert = { kind: "unplanned" | "role-gap"; text: string; detail?: string };
  const alerts: Alert[] = [];

  if (unplanned.length > 0) {
    const label = unplanned.length > 1 ? t("insights.unplannedPlural") : t("insights.unplannedSingular");
    const names = unplanned
      .map((e) => {
        const roleShort = t(`role.${e.role}.short` as any) || e.role;
        return `${getDisplayName(e as any)} (${roleShort})`;
      })
      .join(" · ");
    alerts.push({
      kind: "unplanned",
      text: `${unplanned.length} ${label}`,
      detail: names,
    });
  }

  // Critical category gaps in 9-20h
  for (const role of CRITICAL_ROLES) {
    const missingSlots: string[] = [];
    for (const day of dayKeys) {
      let dayHasRole = false;
      for (const h of ALERT_HOURS) {
        if ((coverage[day]?.[h] ?? []).some((w) => w.role === role)) {
          dayHasRole = true;
          break;
        }
      }
      if (!dayHasRole) missingSlots.push(t(`day.short.${day}` as any) || day.slice(0, 3));
    }
    if (missingSlots.length > 0) {
      const roleLabel = t(`role.${role}.plural` as any) || role;
      alerts.push({
        kind: "role-gap",
        text: `${t("insights.noRole")} ${roleLabel}: ${missingSlots.join(", ")}`,
      });
    }
  }

  // ---- Upcoming leaves (next 7 days) ----
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);
  const in7 = useMemo(() => addDays(today, 7), [today]);
  const empIds = useMemo(() => employees.map((e) => e.id), [employees]);

  const { data: upcoming = [] } = useQuery({
    queryKey: ["overview-upcoming-leaves", formatLocalDate(today), empIds.join(",")],
    enabled: empIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("conges")
        .select("*")
        .in("employee_id", empIds)
        .lte("date_start", formatLocalDate(in7))
        .gte("date_end", formatLocalDate(today))
        .order("date_start", { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });

  const empById = useMemo(() => new Map(employees.map((e) => [e.id, e])), [employees]);

  const DragHandle = () => (
    <span
      className="cursor-grab active:cursor-grabbing text-muted-foreground/60 hover:text-foreground transition-colors"
      title={t("insights.dragToReorder")}
      aria-label={t("insights.dragToReorder")}
    >
      <GripVertical className="h-4 w-4" />
    </span>
  );

  const renderCard = (id: CardId) => {
    if (id === "alerts") {
      if (alerts.length === 0) {
        return (
          <div className="flex items-center gap-2 py-3">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span className="text-sm text-muted-foreground flex-1">{t("insights.allGood")}</span>
            <DragHandle />
          </div>
        );
      }
      return (
        <div className="py-1">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-warning" />
            <span className="text-sm font-semibold flex-1">{t("insights.weekAlerts")}</span>
            <DragHandle />
          </div>
          <ul className="space-y-1.5 text-sm">
            {alerts.map((a, i) => (
              <li key={i} className="text-muted-foreground">
                <div>· <span className="font-medium text-foreground">{a.text}</span></div>
                {a.detail && (
                  <div className="ml-3 text-xs opacity-80 leading-relaxed">{a.detail}</div>
                )}
              </li>
            ))}
          </ul>
        </div>
      );
    }
    if (id === "leaves") {
      return (
        <>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 flex-1">
              <CalendarOff className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-semibold">{t("insights.upcomingLeaves")}</span>
            </div>
            <span className="text-lg font-bold font-mono-data mr-2">{upcoming.length}</span>
            <DragHandle />
          </div>
          {upcoming.length === 0 ? (
            <div className="text-xs text-muted-foreground">{t("insights.noLeaves")}</div>
          ) : (
            <ul className="text-xs text-muted-foreground space-y-0.5">
              {upcoming.slice(0, 6).map((c: any) => {
                const emp = empById.get(c.employee_id);
                const name = emp ? getDisplayName(emp as any) : "—";
                const typeShort = t(`leave.${c.type}.short` as any) || c.type;
                return (
                  <li key={c.id} className="truncate">
                    · <span className="text-foreground">{name}</span>{" "}
                    <span className="opacity-70">({typeShort})</span>{" "}
                    {formatDateBE(new Date(c.date_start))}→{formatDateBE(new Date(c.date_end))}
                  </li>
                );
              })}
              {upcoming.length > 6 && <li className="italic">+ {upcoming.length - 6}…</li>}
            </ul>
          )}
        </>
      );
    }
    if (id === "occupancy") {
      const colorFor = (pct: number) =>
        pct < 90 ? "bg-destructive" : pct > 105 ? "bg-warning" : "bg-emerald-500";
      const textFor = (pct: number) =>
        pct < 90 ? "text-destructive" : pct > 105 ? "text-warning" : "text-emerald-600";
      const globalText = textFor(occupancy);
      return (
        <>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-muted-foreground flex-1">
              {t("insights.occupancyByDept")}
            </span>
            <span className={`text-sm font-bold font-mono-data mr-2 ${globalText}`}>
              {occupancy}%
              <span className="text-muted-foreground font-normal ml-1">
                ({diffHours > 0 ? "+" : ""}{diffHours}h)
              </span>
            </span>
            <Gauge className="h-4 w-4 text-muted-foreground mr-2" />
            <DragHandle />
          </div>
          {occupancyByRole.length === 0 ? (
            <div className="text-xs text-muted-foreground">—</div>
          ) : (
            <ul className="space-y-1.5">
              {occupancyByRole.map((r) => {
                const label = t(`role.${r.role}.plural` as any) || r.role;
                const diff = r.planned - r.contract;
                return (
                  <li key={r.role} className="text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-muted-foreground truncate flex-1">{label}</span>
                      <span className={`font-mono-data font-semibold ${textFor(r.pct)}`}>{r.pct}%</span>
                      <span className="text-muted-foreground font-mono-data tabular-nums w-20 text-right">
                        {r.planned}h/{r.contract}h
                      </span>
                      <span
                        className={`font-mono-data tabular-nums w-10 text-right ${
                          diff === 0 ? "text-muted-foreground" : diff > 0 ? "text-warning" : "text-destructive"
                        }`}
                      >
                        {diff > 0 ? "+" : ""}{diff}h
                      </span>
                    </div>
                    <div className="mt-0.5 h-1 rounded-full bg-muted overflow-hidden">
                      <div
                        className={`h-full ${colorFor(r.pct)}`}
                        style={{ width: `${Math.min(r.pct, 130)}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </>
      );
    }
    if (id === "etp") {
      // Cap planned hours at contract_hours for "cadre" employees (no precise schedule)
      let cappedCount = 0;
      const totalPlannedForEtp = employees.reduce((sum, e) => {
        const planned = plannedByEmp.get(e.id) ?? 0;
        if (e.is_cadre) {
          const cap = Number(e.contract_hours || 0);
          if (planned > cap) cappedCount++;
          return sum + Math.min(planned, cap);
        }
        return sum + planned;
      }, 0);
      const etpContract = totalContract / FTE_BASE;
      const etpPlanned = totalPlannedForEtp / FTE_BASE;
      const etpDiff = etpPlanned - etpContract;
      const diffColor =
        etpDiff < -0.3 ? "text-destructive" : etpDiff > 0.3 ? "text-warning" : "text-emerald-600";
      return (
        <>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 flex-1">
              <Scale className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-semibold">{t("insights.etp")}</span>
              <span className="text-[10px] text-muted-foreground">({t("insights.etpBase")})</span>
            </div>
            <DragHandle />
          </div>
          <div className="grid grid-cols-2 gap-2 text-center">
            <div>
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                {t("insights.etpContract")}
              </div>
              <div className="text-2xl font-bold font-mono-data">{etpContract.toFixed(1)}</div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                {t("insights.etpPlanned")}
              </div>
              <div className="text-2xl font-bold font-mono-data">{etpPlanned.toFixed(1)}</div>
            </div>
          </div>
          <div className={`text-center text-xs font-semibold font-mono-data mt-1 ${diffColor}`}>
            Δ {etpDiff >= 0 ? "+" : ""}{etpDiff.toFixed(1)}&nbsp;FTE
          </div>
          {cappedCount > 0 && (
            <div className="text-center text-[10px] text-muted-foreground mt-0.5">
              {(t("insights.etpCappedNote" as any) || "").replace("{n}", String(cappedCount))}
            </div>
          )}
        </>
      );
    }
    // byDept
    return (
      <>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-muted-foreground flex-1">{t("insights.byDepartment")}</span>
          <Users2 className="h-4 w-4 text-muted-foreground mr-2" />
          <DragHandle />
        </div>
        {headcountByRole.length === 0 ? (
          <div className="text-xs text-muted-foreground mt-1">—</div>
        ) : (
          <ul className="text-xs space-y-1 mt-1">
            {headcountByRole.map((r) => {
              const label = t(`role.${r.role}.plural` as any) || r.role;
              const missing = r.total - r.planned;
              return (
                <li key={r.role} className="flex items-center justify-between gap-2">
                  <span className="text-muted-foreground truncate">{label}</span>
                  <span className="font-mono-data">
                    <span className={missing > 0 ? "text-destructive font-semibold" : "text-foreground"}>
                      {r.planned}
                    </span>
                    <span className="text-muted-foreground">/{r.total}</span>
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </>
    );
  };

  const accentClass = (id: CardId): string => {
    if (id === "alerts") {
      return alerts.length === 0 ? "border-l-4 border-l-emerald-500" : "border-l-4 border-l-warning";
    }
    return "";
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {order.map((id) => (
        <div
          key={id}
          draggable
          onDragStart={(e) => {
            setDragId(id);
            e.dataTransfer.effectAllowed = "move";
          }}
          onDragOver={(e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = "move";
            if (dragId && dragId !== id) setOverId(id);
          }}
          onDragLeave={() => {
            if (overId === id) setOverId(null);
          }}
          onDrop={(e) => {
            e.preventDefault();
            if (dragId) moveCard(dragId, id);
            setDragId(null);
            setOverId(null);
          }}
          onDragEnd={() => {
            setDragId(null);
            setOverId(null);
          }}
          className={`kpi-card transition-all ${CARD_SPAN[id]} ${accentClass(id)} ${
            dragId === id ? "opacity-50" : ""
          } ${overId === id ? "ring-2 ring-primary ring-offset-1" : ""}`}
        >
          {renderCard(id)}
        </div>
      ))}
    </div>
  );
}