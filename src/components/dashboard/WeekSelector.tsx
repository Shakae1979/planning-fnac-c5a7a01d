import type { WeekData } from "@/pages/Index";
import { ChevronDown } from "lucide-react";

interface Props {
  weeks: WeekData[];
  selectedIdx: number;
  onChange: (idx: number) => void;
}

export function WeekSelector({ weeks, selectedIdx, onChange }: Props) {
  const current = weeks[selectedIdx];
  const dateStr = current.week_start
    ? new Date(current.week_start).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "";

  return (
    <div className="relative">
      <select
        value={selectedIdx}
        onChange={(e) => onChange(Number(e.target.value))}
        className="appearance-none bg-secondary text-secondary-foreground pl-4 pr-10 py-2 rounded-lg text-sm font-medium cursor-pointer border border-border focus:outline-none focus:ring-2 focus:ring-accent"
      >
        {weeks.map((w, i) => (
          <option key={i} value={i}>
            {w.sheet} {w.week_start ? `(${new Date(w.week_start).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })})` : ""}
          </option>
        ))}
      </select>
      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
    </div>
  );
}
