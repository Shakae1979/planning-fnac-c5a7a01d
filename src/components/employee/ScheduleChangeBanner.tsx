import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { BellRing, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { formatDateBE, getWeekNumber } from "@/lib/format";

interface Props {
  employeeId: string;
}

/** Bandeau affiché en haut de « Mon planning » quand des changements d'horaire non lus existent. */
export function ScheduleChangeBanner({ employeeId }: Props) {
  const { t } = useI18n();
  const queryClient = useQueryClient();

  const { data: notifications } = useQuery({
    queryKey: ["my-schedule-changes", employeeId],
    enabled: !!employeeId,
    refetchInterval: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("schedule_notifications")
        .select("id, week_start, message, is_read, created_at")
        .eq("employee_id", employeeId)
        .eq("is_read", false)
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) {
        console.error("[schedule-banner] fetch failed", error);
        throw error;
      }
      return data || [];
    },
  });

  const markRead = useMutation({
    mutationFn: async () => {
      const ids = (notifications ?? []).map((n) => n.id);
      if (ids.length === 0) return;
      const { error } = await supabase.from("schedule_notifications").update({ is_read: true }).in("id", ids);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-schedule-changes"] });
      queryClient.invalidateQueries({ queryKey: ["schedule-notifications"] });
    },
  });

  if (!notifications || notifications.length === 0) return null;

  return (
    <div className="mb-4 rounded-lg border border-accent/40 bg-accent/10 p-3">
      <div className="flex items-start gap-2">
        <BellRing className="h-4 w-4 mt-0.5 text-accent shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground">{t("notif.bannerTitle" as any)}</p>
          <ul className="mt-1 space-y-1">
            {notifications.map((n) => (
              <li key={n.id} className="text-[11px] text-muted-foreground leading-snug">
                <span className="font-semibold text-foreground">
                  S{getWeekNumber(new Date(n.week_start + "T00:00:00"))} · {formatDateBE(new Date(n.week_start + "T00:00:00"))}
                </span>{" "}
                — {n.message}
              </li>
            ))}
          </ul>
        </div>
        <button
          onClick={() => markRead.mutate()}
          className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors shrink-0"
        >
          <Check className="h-3 w-3" /> {t("notif.markAllRead" as any)}
        </button>
      </div>
    </div>
  );
}
