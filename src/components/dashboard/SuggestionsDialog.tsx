import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Sparkles, AlertTriangle } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { formatTimeBE } from "@/lib/format";

export type SuggestionSource = "prevWeek" | "prev2Weeks" | "template" | "lastYear";

export interface Suggestion {
  employeeId: string;
  employeeName: string;
  dayKey: string;
  dayLabel: string;
  start: string;
  end: string;
  source: SuggestionSource;
  outOfRange?: boolean;
}

interface Props {
  open: boolean;
  suggestions: Suggestion[];
  onClose: () => void;
  onApply: (selected: Suggestion[]) => void;
}

export function SuggestionsDialog({ open, suggestions, onClose, onApply }: Props) {
  const { t } = useI18n();
  const [excluded, setExcluded] = useState<Set<string>>(new Set());

  const keyOf = (s: Suggestion) => `${s.employeeId}__${s.dayKey}`;

  const sourceLabel: Record<SuggestionSource, string> = {
    prevWeek: t("schedule.source.prevWeek" as any),
    prev2Weeks: t("schedule.source.prev2Weeks" as any),
    template: t("schedule.source.template" as any),
    lastYear: t("schedule.source.lastYear" as any),
  };

  const sourceColor: Record<SuggestionSource, string> = {
    prevWeek: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200",
    prev2Weeks: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-200",
    template: "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-200",
    lastYear: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200",
  };

  const toggle = (s: Suggestion) => {
    setExcluded((prev) => {
      const next = new Set(prev);
      const k = keyOf(s);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      return next;
    });
  };

  const selected = useMemo(
    () => suggestions.filter((s) => !excluded.has(keyOf(s))),
    [suggestions, excluded]
  );

  const outOfRangeCount = useMemo(() => selected.filter((s) => s.outOfRange).length, [selected]);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            {t("schedule.suggestTitle" as any)}
          </DialogTitle>
          <DialogDescription>
            {t("schedule.suggestDesc" as any)}
          </DialogDescription>
        </DialogHeader>

        {suggestions.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground text-sm">
            {t("schedule.suggestEmpty" as any)}
          </div>
        ) : (
          <div className="overflow-y-auto flex-1 -mx-2 px-2">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-card">
                <tr className="border-b text-muted-foreground">
                  <th className="text-left py-2 pl-2 w-8"></th>
                  <th className="text-left py-2">{t("schedule.seller")}</th>
                  <th className="text-left py-2">{t("hours.detailDay")}</th>
                  <th className="text-left py-2">{t("hours.detailShift")}</th>
                  <th className="text-left py-2">{t("schedule.source" as any)}</th>
                </tr>
              </thead>
              <tbody>
                {suggestions.map((s) => {
                  const k = keyOf(s);
                  const isExcluded = excluded.has(k);
                  return (
                    <tr key={k} className={`border-b last:border-0 ${isExcluded ? "opacity-40" : ""}`}>
                      <td className="py-2 pl-2">
                        <Checkbox checked={!isExcluded} onCheckedChange={() => toggle(s)} />
                      </td>
                      <td className="py-2">{s.employeeName}</td>
                      <td className="py-2 capitalize">{s.dayLabel}</td>
                      <td className="py-2 font-mono">
                        {formatTimeBE(s.start)} → {formatTimeBE(s.end)}
                        {s.outOfRange && (
                          <AlertTriangle className="inline h-3 w-3 ml-1 text-amber-500" />
                        )}
                      </td>
                      <td className="py-2">
                        <Badge variant="secondary" className={`text-[10px] ${sourceColor[s.source]}`}>
                          {sourceLabel[s.source]}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <DialogFooter className="flex-col sm:flex-row gap-2 items-stretch sm:items-center">
          <div className="text-xs text-muted-foreground mr-auto flex items-center gap-3">
            <span>
              {selected.length} / {suggestions.length} {t("schedule.suggestSelected" as any)}
            </span>
            {outOfRangeCount > 0 && (
              <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                <AlertTriangle className="h-3 w-3" />
                {outOfRangeCount} {t("schedule.outOfRange" as any)}
              </span>
            )}
          </div>
          <Button variant="outline" onClick={onClose}>
            {t("action.cancel" as any)}
          </Button>
          <Button onClick={() => onApply(selected)} disabled={selected.length === 0}>
            <Sparkles className="h-3.5 w-3.5 mr-1" />
            {t("schedule.suggestApply" as any)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}