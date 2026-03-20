import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";

const ROLES = [
  { value: "responsable", label: "Responsable", color: "bg-orange-100 text-orange-800" },
  { value: "technique", label: "Technique", color: "bg-blue-100 text-blue-800" },
  { value: "editorial", label: "Éditorial", color: "bg-purple-100 text-purple-800" },
  { value: "stock", label: "Stock", color: "bg-amber-100 text-amber-800" },
  { value: "caisse", label: "Caisse", color: "bg-emerald-100 text-emerald-800" },
] as const;

export function EmployeeManager() {
  const queryClient = useQueryClient();
  const [newName, setNewName] = useState("");
  const [newHours, setNewHours] = useState("36");
  const [newRole, setNewRole] = useState("technique");

  const { data: employees } = useQuery({
    queryKey: ["employees"],
    queryFn: async () => {
      const { data, error } = await supabase.from("employees").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      const trimmed = newName.trim();
      if (!trimmed) throw new Error("Le nom est requis");
      if (trimmed.length > 100) throw new Error("Nom trop long");
      const { error } = await supabase.from("employees").insert({
        name: trimmed,
        contract_hours: Number(newHours) || 36,
        role: newRole,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setNewName("");
      setNewHours("36");
      setNewRole("technique");
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      toast.success("Collaborateur ajouté !");
    },
    onError: (err) => toast.error((err as Error).message),
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase.from("employees").update({ is_active: active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      toast.success("Mis à jour !");
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ id, role }: { id: string; role: string }) => {
      const { error } = await supabase.from("employees").update({ role }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      toast.success("Département mis à jour !");
    },
    onError: (err) => toast.error((err as Error).message),
  });

  const roleOrder = ["responsable", "technique", "editorial", "stock", "caisse"];
  const active = (employees?.filter((e) => e.is_active) ?? []).sort((a, b) => {
    const ra = roleOrder.indexOf(a.role);
    const rb = roleOrder.indexOf(b.role);
    if (ra !== rb) return (ra === -1 ? 99 : ra) - (rb === -1 ? 99 : rb);
    return a.name.localeCompare(b.name);
  });
  const inactive = employees?.filter((e) => !e.is_active) ?? [];

  return (
    <div className="space-y-6">
      {/* Add employee */}
      <div className="kpi-card">
        <h3 className="text-sm font-semibold text-muted-foreground mb-3">Ajouter un collaborateur</h3>
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <label className="text-xs text-muted-foreground">Nom</label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Prénom"
              maxLength={100}
              className="w-full mt-1 px-3 py-2 text-sm rounded-md border bg-background focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
          <div className="w-32">
            <label className="text-xs text-muted-foreground">Heures contrat</label>
            <input
              type="number"
              value={newHours}
              onChange={(e) => setNewHours(e.target.value)}
              className="w-full mt-1 px-3 py-2 text-sm rounded-md border bg-background focus:outline-none focus:ring-2 focus:ring-accent font-mono-data"
            />
          </div>
          <div className="w-40">
            <label className="text-xs text-muted-foreground">Département</label>
            <select
              value={newRole}
              onChange={(e) => setNewRole(e.target.value)}
              className="w-full mt-1 px-3 py-2 text-sm rounded-md border bg-background focus:outline-none focus:ring-2 focus:ring-accent"
            >
              {ROLES.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>
          <Button size="sm" onClick={() => addMutation.mutate()} disabled={addMutation.isPending}>
            <Plus className="h-3.5 w-3.5 mr-1" /> Ajouter
          </Button>
        </div>
      </div>

      {/* Active employees */}
      <div className="kpi-card">
        <h3 className="text-sm font-semibold text-muted-foreground mb-3">
          Collaborateurs actifs ({active.length})
        </h3>
        <div className="space-y-1">
          {active.map((emp) => (
            <div key={emp.id} className="flex items-center justify-between py-2 px-2 rounded table-row-hover">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-accent/20 flex items-center justify-center text-xs font-bold text-accent">
                  {emp.name.charAt(0)}
                </div>
                <div>
                  <div className="text-sm font-medium">{emp.name}</div>
                  <div className="text-xs text-muted-foreground">
                    <select
                      value={emp.role}
                      onChange={(e) => updateRoleMutation.mutate({ id: emp.id, role: e.target.value })}
                      className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium border-none cursor-pointer ${ROLES.find(r => r.value === emp.role)?.color ?? "bg-muted text-muted-foreground"}`}
                    >
                      {ROLES.map((r) => (
                        <option key={r.value} value={r.value}>{r.label}</option>
                      ))}
                    </select>
                    {" · "}<span className="font-mono-data">{emp.contract_hours}h</span>
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive"
                onClick={() => toggleMutation.mutate({ id: emp.id, active: false })}
              >
                <Trash2 className="h-3.5 w-3.5 mr-1" /> Désactiver
              </Button>
            </div>
          ))}
        </div>
      </div>

      {inactive.length > 0 && (
        <div className="kpi-card">
          <h3 className="text-sm font-semibold text-muted-foreground mb-3">
            Inactifs ({inactive.length})
          </h3>
          <div className="space-y-1">
            {inactive.map((emp) => (
              <div key={emp.id} className="flex items-center justify-between py-2 px-2 rounded table-row-hover opacity-60">
                <span className="text-sm">{emp.name}</span>
                <Button variant="outline" size="sm" onClick={() => toggleMutation.mutate({ id: emp.id, active: true })}>
                  Réactiver
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
