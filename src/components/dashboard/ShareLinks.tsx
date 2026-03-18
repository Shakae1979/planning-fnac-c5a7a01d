import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Copy, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function ShareLinks() {
  const { data: employees } = useQuery({
    queryKey: ["employees"],
    queryFn: async () => {
      const { data, error } = await supabase.from("employees").select("*").eq("is_active", true).order("name");
      if (error) throw error;
      return data;
    },
  });

  const baseUrl = window.location.origin;

  const copyLink = (name: string) => {
    const url = `${baseUrl}/mon-planning/${encodeURIComponent(name)}`;
    navigator.clipboard.writeText(url);
    toast.success(`Lien copié pour ${name} !`);
  };

  return (
    <div className="space-y-6">
      {/* Team day link */}
      <div className="kpi-card">
        <h3 className="text-sm font-semibold text-muted-foreground mb-2">Planning équipe du jour</h3>
        <p className="text-sm text-muted-foreground mb-3">
          Lien partageable affichant tous les vendeurs qui travaillent un jour donné, classés par catégorie.
        </p>
        <div className="flex items-center justify-between py-2.5 px-3 rounded-md bg-secondary/50">
          <div className="text-xs text-muted-foreground font-mono-data truncate max-w-[400px]">
            {baseUrl}/equipe-du-jour
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={() => { navigator.clipboard.writeText(`${baseUrl}/equipe-du-jour`); toast.success("Lien copié !"); }}>
              <Copy className="h-3.5 w-3.5 mr-1" /> Copier
            </Button>
            <a href={`${baseUrl}/equipe-du-jour`} target="_blank" rel="noopener noreferrer">
              <Button variant="ghost" size="sm">
                <ExternalLink className="h-3.5 w-3.5" />
              </Button>
            </a>
          </div>
        </div>
      </div>

      <div className="kpi-card">
        <h3 className="text-sm font-semibold text-muted-foreground mb-2">Liens personnels</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Chaque vendeur peut consulter son planning via un lien unique. Partagez-le par message ou par email.
        </p>

        <div className="space-y-2">
          {employees?.map((emp) => {
            const url = `${baseUrl}/mon-planning/${encodeURIComponent(emp.name)}`;
            return (
              <div key={emp.id} className="flex items-center justify-between py-2.5 px-3 rounded-md bg-secondary/50">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-accent/20 flex items-center justify-center text-xs font-bold text-accent">
                    {emp.name.charAt(0)}
                  </div>
                  <div>
                    <div className="text-sm font-medium">{emp.name}</div>
                    <div className="text-xs text-muted-foreground font-mono-data truncate max-w-[300px]">{url}</div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" onClick={() => copyLink(emp.name)}>
                    <Copy className="h-3.5 w-3.5 mr-1" /> Copier
                  </Button>
                  <a href={url} target="_blank" rel="noopener noreferrer">
                    <Button variant="ghost" size="sm">
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Button>
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
