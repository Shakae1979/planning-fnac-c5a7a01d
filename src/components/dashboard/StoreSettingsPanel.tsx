import { useStoreSettings } from "@/hooks/useStoreSettings";
import { useStore } from "@/hooks/useStore";
import { useI18n } from "@/lib/i18n";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Clock } from "lucide-react";

const HOUR_OPTIONS = Array.from({ length: 17 }, (_, i) => i + 6); // 6 to 22

export function StoreSettingsPanel() {
  const { t } = useI18n();
  const { currentStore } = useStore();
  const { scheduleStart, scheduleEnd, saveSettings } = useStoreSettings();

  if (!currentStore) return null;

  const handleChange = async (field: "schedule_start_hour" | "schedule_end_hour", value: number) => {
    const newValues = {
      schedule_start_hour: field === "schedule_start_hour" ? value : scheduleStart,
      schedule_end_hour: field === "schedule_end_hour" ? value : scheduleEnd,
    };
    if (newValues.schedule_start_hour >= newValues.schedule_end_hour) {
      toast.error("L'heure de début doit être avant l'heure de fin");
      return;
    }
    try {
      await saveSettings.mutateAsync(newValues);
      toast.success("Paramètres sauvegardés");
    } catch {
      toast.error("Erreur lors de la sauvegarde");
    }
  };

  return (
    <div>
      <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
        <Clock className="h-5 w-5" />
        Paramètres du magasin
      </h2>
      <div className="max-w-md rounded-lg border bg-card p-6 space-y-6">
        <div>
          <h3 className="text-sm font-semibold mb-1">Horaires d'affichage du planning</h3>
          <p className="text-xs text-muted-foreground mb-4">
            Définissez la plage horaire affichée dans les vues planning pour <strong>{currentStore.name}</strong>.
          </p>
          <div className="flex items-center gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Début</label>
              <Select value={String(scheduleStart)} onValueChange={(v) => handleChange("schedule_start_hour", Number(v))}>
                <SelectTrigger className="w-[100px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {HOUR_OPTIONS.filter(h => h < scheduleEnd).map(h => (
                    <SelectItem key={h} value={String(h)}>{h}h00</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <span className="text-muted-foreground mt-5">→</span>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Fin</label>
              <Select value={String(scheduleEnd)} onValueChange={(v) => handleChange("schedule_end_hour", Number(v))}>
                <SelectTrigger className="w-[100px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {HOUR_OPTIONS.filter(h => h > scheduleStart).map(h => (
                    <SelectItem key={h} value={String(h)}>{h}h00</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
