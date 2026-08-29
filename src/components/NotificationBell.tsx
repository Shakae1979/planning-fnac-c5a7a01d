import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/lib/i18n";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDateBE, getWeekNumber } from "@/lib/format";

interface ScheduleNotification {
  id: string;
  employee_id: string;
  week_start: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export function NotificationBell() {
  const { user } = useAuth();
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const email = user?.email ?? null;

  const { data: myEmployeeIds } = useQuery({
    queryKey: ["my-employee-ids", email],
    enabled: !!email,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("employees")
        .select("id")
        .ilike("email", email!);
      if (error) throw error;
      return (data || []).map((e) => e.id);
    },
  });

  const hasEmployee = (myEmployeeIds ?? []).length > 0;

  const { data: notifications } = useQuery({
    queryKey: ["schedule-notifications", myEmployeeIds],
    enabled: hasEmployee,
    refetchInterval: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("schedule_notifications")
        .select("id, employee_id, week_start, message, is_read, created_at")
        .in("employee_id", myEmployeeIds!)
        .order("created_at", { ascending: false })
        .limit(30);
      if (error) throw error;
      return (data || []) as ScheduleNotification[];
    },
  });

  const unread = (notifications ?? []).filter((n) => !n.is_read);

  const markAllRead = useMutation({
    mutationFn: async () => {
      if (unread.length === 0) return;
      const { error } = await supabase
        .from("schedule_notifications")
        .update({ is_read: true })
        .in("id", unread.map((n) => n.id));
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedule-notifications"] });
    },
  });

  const markOneRead = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("schedule_notifications")
        .update({ is_read: true })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedule-notifications"] });
    },
  });

  if (!hasEmployee) return null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className="relative flex items-center justify-center h-8 w-8 rounded-md transition-colors hover:opacity-80"
          style={{ background: "hsl(var(--sidebar-hover))", color: "hsl(var(--sidebar-fg))" }}
          title={t("notif.title" as any)}
          aria-label={t("notif.title" as any)}
        >
          <Bell className="h-3.5 w-3.5" />
          {unread.length > 0 && (
            <span
              className="absolute -top-1 -right-1 flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full text-[9px] font-bold"
              style={{ background: "hsl(var(--sidebar-active))", color: "hsl(var(--accent-foreground))" }}
            >
              {unread.length > 9 ? "9+" : unread.length}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between px-3 py-2 border-b">
          <p className="text-sm font-semibold text-foreground">{t("notif.title" as any)}</p>
          {unread.length > 0 && (
            <button
              onClick={() => markAllRead.mutate()}
              className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
            >
              <Check className="h-3 w-3" /> {t("notif.markAllRead" as any)}
            </button>
          )}
        </div>
        <ScrollArea className="max-h-80">
          {(notifications ?? []).length === 0 ? (
            <p className="px-3 py-6 text-center text-xs text-muted-foreground italic">
              {t("notif.empty" as any)}
            </p>
          ) : (
            (notifications ?? []).map((n) => (
              <button
                key={n.id}
                onClick={() => { if (!n.is_read) markOneRead.mutate(n.id); }}
                className={`w-full text-left px-3 py-2 border-b last:border-b-0 transition-colors hover:bg-muted/50 ${n.is_read ? "opacity-60" : ""}`}
              >
                <div className="flex items-center gap-1.5">
                  {!n.is_read && <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ background: "hsl(var(--sidebar-active))" }} />}
                  <span className="text-[11px] font-semibold text-foreground">
                    S{getWeekNumber(new Date(n.week_start + "T00:00:00"))} · {formatDateBE(new Date(n.week_start + "T00:00:00"))}
                  </span>
                </div>
                <p className="mt-0.5 text-[11px] text-muted-foreground leading-snug">{n.message}</p>
              </button>
            ))
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
