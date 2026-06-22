import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, CalendarDays, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { fr, nl } from "date-fns/locale";
import { cn } from "@/lib/utils";
import {
  formatDateBE,
  getWeekNumber,
  getMondayFromISOWeek,
  getMondayOf,
  weeksBetween,
} from "@/lib/format";
import { useI18n } from "@/lib/i18n";

type Mode = "week" | "day";

interface Props {
  /** Offset relative to current week/day (0 = current) */
  offset: number;
  /** Receives the new offset */
  onChange: (next: number) => void;
  /** Optional callback when changing (e.g. clear local edits) */
  onBeforeChange?: () => void;
  mode?: Mode;
  /** Optional extra label content next to date (e.g. "Sem A") */
  rightLabel?: React.ReactNode;
  /** Optional sub-label below the main date label */
  subLabel?: React.ReactNode;
  className?: string;
  /** When true, keyboard shortcuts are disabled */
  disableShortcuts?: boolean;
}

function isTypingTarget(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false;
  const tag = el.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  if (el.isContentEditable) return true;
  return false;
}

export function WeekNavigator({
  offset,
  onChange,
  onBeforeChange,
  mode = "week",
  rightLabel,
  subLabel,
  className,
  disableShortcuts,
}: Props) {
  const { t, lang } = useI18n();
  const locale = lang === "nl" ? nl : fr;
  const [calOpen, setCalOpen] = useState(false);
  const [weekInput, setWeekInput] = useState("");
  const triggerRef = useRef<HTMLButtonElement>(null);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Reference Monday or Day for current offset
  const baseMonday = getMondayOf(today);
  const currentMonday = new Date(baseMonday);
  currentMonday.setDate(baseMonday.getDate() + offset * 7);

  const currentDay = new Date(today);
  currentDay.setDate(today.getDate() + offset);

  const refDate = mode === "week" ? currentMonday : currentDay;

  const change = (next: number) => {
    onBeforeChange?.();
    onChange(next);
  };

  const goToday = () => change(0);
  const stepBack = () => change(offset - 1);
  const stepFwd = () => change(offset + 1);
  const stepBackBig = () => change(offset - (mode === "week" ? 4 : 7));
  const stepFwdBig = () => change(offset + (mode === "week" ? 4 : 7));

  const handlePick = (d: Date | undefined) => {
    if (!d) return;
    if (mode === "week") {
      const monday = getMondayOf(d);
      const next = weeksBetween(baseMonday, monday);
      change(next);
    } else {
      const a = new Date(today);
      const b = new Date(d);
      b.setHours(0, 0, 0, 0);
      const days = Math.round((b.getTime() - a.getTime()) / 86400000);
      change(days);
    }
    setCalOpen(false);
  };

  const handleWeekSubmit = () => {
    const raw = weekInput.trim().replace(/^[sSwW]/, "");
    if (!raw) return;
    const parts = raw.split(/[\/\-\s]/).map((p) => parseInt(p, 10));
    const week = parts[0];
    const year = parts[1] && !isNaN(parts[1]) ? parts[1] : today.getFullYear();
    if (!week || isNaN(week) || week < 1 || week > 53) return;
    const monday = getMondayFromISOWeek(week, year);
    const next = weeksBetween(baseMonday, monday);
    change(next);
    setWeekInput("");
    setCalOpen(false);
  };

  // Keyboard shortcuts
  useEffect(() => {
    if (disableShortcuts) return;
    const handler = (e: KeyboardEvent) => {
      if (isTypingTarget(e.target)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        e.shiftKey ? stepBackBig() : stepBack();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        e.shiftKey ? stepFwdBig() : stepFwd();
      } else if (e.key === "t" || e.key === "T" || e.key === "Home") {
        e.preventDefault();
        goToday();
      } else if (e.key === "g" || e.key === "G") {
        e.preventDefault();
        setCalOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offset, disableShortcuts]);

  const weekNum = getWeekNumber(refDate);
  const endOfWeek = new Date(currentMonday);
  endOfWeek.setDate(currentMonday.getDate() + 5);

  const mainLabel =
    mode === "week"
      ? `S${weekNum} · ${formatDateBE(currentMonday)} → ${formatDateBE(endOfWeek)}`
      : formatDateBE(currentDay);

  const isToday = offset === 0;

  return (
    <TooltipProvider delayDuration={300}>
      <div className={cn("flex items-center gap-1.5 no-print", className)}>
        {!isToday && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={goToday}
                className="h-8 px-2 gap-1 border-foreground/20 text-foreground hover:bg-foreground/10 text-xs"
              >
                <Home className="h-3 w-3" />
                <span className="hidden md:inline">{t("nav.today")}</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t("nav.today")} (T)</TooltipContent>
          </Tooltip>
        )}

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 border-foreground/20 text-foreground hover:bg-foreground/10"
              onClick={stepBack}
              aria-label="prev"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>← / Shift+← {mode === "week" ? "(−4 sem.)" : "(−7 j.)"}</TooltipContent>
        </Tooltip>

        <Popover open={calOpen} onOpenChange={setCalOpen}>
          <PopoverTrigger asChild>
            <Button
              ref={triggerRef}
              variant="outline"
              size="sm"
              className="h-8 px-2 gap-1.5 border-foreground/20 text-foreground hover:bg-foreground/10 font-semibold"
              title={t("nav.pickDate")}
            >
              <CalendarDays className="h-3.5 w-3.5" />
              <span className="text-xs">{mainLabel}</span>
              {rightLabel}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-3 space-y-3" align="center">
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
                {t("nav.weekNumber")}
              </label>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleWeekSubmit();
                }}
                className="flex items-center gap-1.5"
              >
                <Input
                  value={weekInput}
                  onChange={(e) => setWeekInput(e.target.value)}
                  placeholder={t("nav.weekNumberPh")}
                  className="h-8 text-sm w-36"
                  autoFocus
                />
                <Button type="submit" size="sm" className="h-8 px-3">
                  {t("nav.go")}
                </Button>
              </form>
            </div>
            <div className="border-t pt-2">
              <Calendar
                mode="single"
                selected={refDate}
                onSelect={handlePick}
                weekStartsOn={1}
                showWeekNumber
                locale={locale}
                className={cn("p-0 pointer-events-auto")}
              />
            </div>
            <div className="flex items-center justify-between border-t pt-2">
              <Button variant="ghost" size="sm" onClick={goToday} className="h-7 text-xs gap-1.5">
                <Home className="h-3 w-3" /> {t("nav.today")}
              </Button>
              <span className="text-[10px] text-muted-foreground italic max-w-[220px] text-right leading-tight">
                {mode === "week" ? t("nav.shortcuts") : t("nav.shortcutsDay")}
              </span>
            </div>
          </PopoverContent>
        </Popover>

        {subLabel}

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 border-foreground/20 text-foreground hover:bg-foreground/10"
              onClick={stepFwd}
              aria-label="next"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>→ / Shift+→ {mode === "week" ? "(+4 sem.)" : "(+7 j.)"}</TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}

export default WeekNavigator;