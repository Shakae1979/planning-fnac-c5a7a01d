import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Copy, ExternalLink, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useStore } from "@/hooks/useStore";
import { useI18n } from "@/lib/i18n";

const ROLE_COLORS: Record<string, string> = {
  responsable: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  technique: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  editorial: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  stock: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  caisse: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
};

const AVATAR_COLORS = [
  "bg-blue-500", "bg-emerald-500", "bg-violet-500", "bg-rose-500",
  "bg-amber-500", "bg-cyan-500", "bg-indigo-500", "bg-pink-500",
  "bg-teal-500", "bg-orange-500",
];

export function ShareLinks() {
  const { t } = useI18n();
  const { currentStore } = useStore();
  const { data: employees } = useQuery({
    queryKey: ["employees", currentStore?.id],
    queryFn: async () => {
      let query = supabase.from("employees").select("*").eq("is_active", true).order("name");
      if (currentStore) query = query.eq("store_id", currentStore.id);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const baseUrl = window.location.origin;

  const copyLink = (name: string) => {
    const url = `${baseUrl}/mon-planning/${encodeURIComponent(name)}`;
    navigator.clipboard.writeText(url);
    toast.success(t("share.linkCopied"));
  };

  const copyAllLinks = () => {
    if (!employees) return;
    const text = employees
      .map((emp) => `${emp.name}: ${baseUrl}/mon-planning/${encodeURIComponent(emp.name)}`)
      .join("\n");
    navigator.clipboard.writeText(text);
    toast.success(t("share.allCopied"));
  };

  const grouped = employees?.reduce((acc, emp) => {
    const role = emp.role || "autre";
    if (!acc[role]) acc[role] = [];
    acc[role].push(emp);
    return acc;
  }, {} as Record<string, typeof employees>);

  const roleOrder = ["responsable", "technique", "editorial", "stock", "caisse", "stagiaire"];
  const sortedRoles = Object.keys(grouped ?? {}).sort((a, b) => {
    const ia = roleOrder.indexOf(a);
    const ib = roleOrder.indexOf(b);
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
  });

  return (
    <div className="space-y-6">
      <div className="kpi-card">
        <h3 className="text-sm font-semibold text-muted-foreground mb-3">{t("share.teamLinks")}</h3>
        <div className="space-y-2">
          {[
            { label: t("share.dayLabel"), desc: t("share.dayDesc"), path: "/equipe-du-jour" },
            { label: t("share.weekLabel"), desc: t("share.weekDesc"), path: "/planning-equipe" },
            { label: t("nav.conges"), desc: "Vue consultation congés (lecture seule)", path: "/conges" },
          ].map((link) => (
            <div key={link.path} className="flex items-center justify-between py-2.5 px-3 rounded-md bg-secondary/50">
              <div>
                <div className="text-sm font-medium">{link.label}</div>
                <div className="text-xs text-muted-foreground">{link.desc}</div>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="sm" onClick={() => { navigator.clipboard.writeText(`${baseUrl}${link.path}`); toast.success(t("share.linkCopied")); }}>
                  <Copy className="h-3.5 w-3.5 mr-1" /> {t("action.copy")}
                </Button>
                <a href={`${baseUrl}${link.path}`} target="_blank" rel="noopener noreferrer">
                  <Button variant="ghost" size="sm">
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Button>
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="kpi-card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4" />
              {t("share.directory")} — {employees?.length ?? 0} {t("share.sellers")}
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              {t("share.clickToCopy")}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={copyAllLinks}>
            <Copy className="h-3.5 w-3.5 mr-1" /> {t("share.copyAll")}
          </Button>
        </div>

        {sortedRoles.map((role) => {
          const emps = grouped![role]!;
          return (
            <div key={role} className="mb-5 last:mb-0">
              <div className="flex items-center gap-2 mb-3">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${ROLE_COLORS[role] ?? "bg-muted text-muted-foreground"}`}>
                  {t(`role.${role}` as any) || role}
                </span>
                <span className="text-xs text-muted-foreground">{emps.length} {t("share.sellers")}</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {emps.map((emp) => {
                  const url = `${baseUrl}/mon-planning/${encodeURIComponent(emp.name)}`;
                  const colorClass = AVATAR_COLORS[emp.name.charCodeAt(0) % AVATAR_COLORS.length];
                  return (
                    <button
                      key={emp.id}
                      onClick={() => copyLink(emp.name)}
                      className="group relative flex flex-col items-center gap-2 p-4 rounded-xl border border-border/50 bg-card hover:bg-accent/10 hover:border-accent/30 transition-all duration-200 cursor-pointer hover:shadow-md"
                    >
                      <div className={`h-12 w-12 rounded-full ${colorClass} flex items-center justify-center text-white text-lg font-bold shadow-sm group-hover:scale-110 transition-transform`}>
                        {emp.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()}
                      </div>
                      <span className="text-sm font-semibold text-foreground text-center leading-tight">
                        {emp.name}
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${ROLE_COLORS[emp.role] ?? "bg-muted text-muted-foreground"}`}>
                        {t(`role.${emp.role}` as any) || emp.role}
                      </span>
                      <div className="absolute inset-0 rounded-xl flex items-center justify-center bg-accent/90 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <div className="flex items-center gap-1.5 text-accent-foreground font-medium text-sm">
                          <Copy className="h-4 w-4" />
                          {t("share.copyLink")}
                        </div>
                      </div>
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10 p-1 rounded-md bg-background/80 hover:bg-background text-foreground"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
