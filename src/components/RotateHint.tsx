import { useState } from "react";
import { RotateCw, X } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export function RotateHint() {
  const { t } = useI18n();
  const [hidden, setHidden] = useState(false);
  if (hidden) return null;
  return (
    <div className="hidden max-sm:portrait:flex items-center gap-2 bg-accent/10 border-b border-accent/20 px-3 py-1.5 text-[11px] text-foreground/80 no-print">
      <RotateCw className="h-3.5 w-3.5 shrink-0 text-accent" />
      <span className="flex-1">{t("rotate.hint" as any)}</span>
      <button
        onClick={() => setHidden(true)}
        aria-label={t("rotate.dismiss" as any)}
        className="shrink-0 p-0.5 rounded hover:bg-foreground/10"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}