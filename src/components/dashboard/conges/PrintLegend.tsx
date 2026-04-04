import { CONGE_TYPES_KEYS, CONGE_TYPE_COLORS } from "../CongesCalendar";
import { useI18n } from "@/lib/i18n";

export function PrintLegend() {
  const { t } = useI18n();

  const items = CONGE_TYPES_KEYS.map((k) => ({
    label: t(`leave.${k}` as any),
    color: CONGE_TYPE_COLORS[k],
  }));

  return (
    <div className="hidden print-legend">
      {items.map((item) => (
        <span key={item.label} className="flex items-center gap-1">
          <span className={`inline-block w-2.5 h-2.5 rounded ${item.color}`} />
          {item.label}
        </span>
      ))}
      <span className="flex items-center gap-1">
        <span className="inline-block w-2.5 h-2.5 rounded bg-amber-400/40" />
        {t("leave.school.fr")}
      </span>
      <span className="flex items-center gap-1">
        <span className="inline-block w-2.5 h-2.5 rounded bg-sky-300/30" />
        {t("leave.school.nl")}
      </span>
    </div>
  );
}
