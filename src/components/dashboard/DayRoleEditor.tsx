import { useMemo, useState } from "react";
import { Plus, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useI18n } from "@/lib/i18n";
import { getRoleColors, FLOOR_ROLE_KEYS } from "@/lib/role-colors";
import { useStore } from "@/hooks/useStore";
import { buildRoleSegments, rolesOfDay, toMin, toTime, type DayRoleRow } from "@/lib/day-roles";
import { formatTimeBE } from "@/lib/format";

export interface DayRoleRange {
  role: string;
  start: string;
  end: string;
}

interface Props {
  rows: DayRoleRow[] | undefined;
  mainRole: string;
  secondaries: string[];
  shiftStart: string | null;
  shiftEnd: string | null;
  onSave: (ranges: DayRoleRange[]) => void;
}

function buildOptions(startMin: number, endMin: number): string[] {
  const opts: string[] = [];
  for (let m = startMin; m <= endMin; m += 30) opts.push(toTime(m));
  return opts;
}

export default function DayRoleEditor({ rows, mainRole, secondaries, shiftStart, shiftEnd, onSave }: Props) {
  const { t } = useI18n();
  const { currentStore } = useStore();
  const [open, setOpen] = useState(false);
  const twoFloors = currentStore?.has_two_floors === true;
  const availableSecondaries = secondaries.filter(
    (r) => twoFloors || !(FLOOR_ROLE_KEYS as readonly string[]).includes(r)
  );

  const sMin = toMin(shiftStart);
  const eMin = toMin(shiftEnd);

  const segments = useMemo(
    () => buildRoleSegments(rows, mainRole, shiftStart, shiftEnd),
    [rows, mainRole, shiftStart, shiftEnd]
  );
  const usedRoles = rolesOfDay(segments);

  const [draft, setDraft] = useState<DayRoleRange[] | null>(null);
  const ranges: DayRoleRange[] =
    draft ??
    (rows || [])
      .filter((r) => r.start_time && r.end_time)
      .map((r) => ({ role: r.role, start: r.start_time as string, end: r.end_time as string }));

  if (sMin === null || eMin === null || eMin <= sMin) return null;

  const timeOptions = buildOptions(sMin, eMin);
  const roleOptions = [mainRole, ...availableSecondaries];

  const update = (i: number, patch: Partial<DayRoleRange>) => {
    const next = ranges.map((r, idx) => (idx === i ? { ...r, ...patch } : r));
    setDraft(next);
  };

  const addRange = () => {
    const last = ranges[ranges.length - 1];
    const start = last ? last.end : toTime(sMin);
    const startM = toMin(start) ?? sMin;
    if (startM >= eMin) return;
    const end = toTime(Math.min(eMin, startM + 120));
    setDraft([...ranges, { role: availableSecondaries[0] || mainRole, start, end }]);
  };

  const removeRange = (i: number) => setDraft(ranges.filter((_, idx) => idx !== i));

  const commit = () => {
    const clean = ranges.filter((r) => {
      const a = toMin(r.start);
      const b = toMin(r.end);
      return a !== null && b !== null && b > a;
    });
    onSave(clean);
    setDraft(null);
    setOpen(false);
  };

  const label =
    usedRoles.length > 1
      ? usedRoles.map((r) => t(`role.${r}.short` as any)).join(" / ")
      : t(`role.${usedRoles[0] || mainRole}.short` as any);

  const title = segments
    .map((s) => `${formatTimeBE(s.start)}–${formatTimeBE(s.end)} ${t(`role.${s.role}` as any)}`)
    .join("\n");

  return (
    <div className="flex justify-center mt-0.5 no-print">
      <Popover open={open} onOpenChange={(o) => { setOpen(o); if (!o) setDraft(null); }}>
        <PopoverTrigger asChild>
          <button
            type="button"
            title={`${t("schedule.dayRole" as any)}\n${title}`}
            className="flex items-center gap-1 px-1 py-0 rounded-full border border-border/60 hover:bg-muted text-[9px] text-muted-foreground max-w-full truncate"
          >
            <span className="flex items-center gap-0.5 shrink-0">
              {usedRoles.map((r) => (
                <span key={r} className={`w-2 h-2 rounded-full ${getRoleColors(r).dot}`} />
              ))}
            </span>
            <span className="truncate">{label}</span>
          </button>
        </PopoverTrigger>
        <PopoverContent align="center" className="w-72 p-2 space-y-2">
          <div className="text-[11px] font-semibold">
            {t("schedule.dayRole" as any)}
            <span className="ml-1 font-normal text-muted-foreground">
              {formatTimeBE(toTime(sMin))}–{formatTimeBE(toTime(eMin))}
            </span>
          </div>

          {ranges.length === 0 && (
            <p className="text-[10px] text-muted-foreground">Autre rôle</p>
          )}

          <div className="space-y-1">
            {ranges.map((r, i) => (
              <div key={i} className="flex items-center gap-1">
                <select
                  value={r.start}
                  onChange={(e) => update(i, { start: e.target.value })}
                  className="px-1 py-0.5 text-[11px] rounded border bg-background font-mono-data"
                >
                  {timeOptions.map((o) => (
                    <option key={o} value={o}>{formatTimeBE(o)}</option>
                  ))}
                </select>
                <span className="text-[10px] text-muted-foreground">→</span>
                <select
                  value={r.end}
                  onChange={(e) => update(i, { end: e.target.value })}
                  className="px-1 py-0.5 text-[11px] rounded border bg-background font-mono-data"
                >
                  {timeOptions.map((o) => (
                    <option key={o} value={o}>{formatTimeBE(o)}</option>
                  ))}
                </select>
                <select
                  value={r.role}
                  onChange={(e) => update(i, { role: e.target.value })}
                  className="flex-1 min-w-0 px-1 py-0.5 text-[11px] rounded border bg-background"
                >
                  {roleOptions.map((o) => (
                    <option key={o} value={o}>{t(`role.${o}` as any)}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => removeRange(i)}
                  className="p-0.5 rounded hover:bg-muted text-muted-foreground"
                  title={t("action.delete" as any)}
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={addRange}
              className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] hover:bg-muted text-muted-foreground"
            >
              <Plus className="h-3 w-3" />
              Autre rôle
            </button>
            <button
              type="button"
              onClick={commit}
              className="px-2 py-0.5 rounded bg-primary text-primary-foreground text-[11px] font-medium"
            >
              {t("action.save" as any)}
            </button>
          </div>

          <p className="text-[9px] text-muted-foreground">{t("schedule.dayRole.mainFill" as any)}</p>
        </PopoverContent>
      </Popover>
    </div>
  );
}
