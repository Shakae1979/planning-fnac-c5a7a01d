import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Plus, Trash2, Pencil, Store, X, Save, Loader2 } from "lucide-react";

export function StoreManager() {
  const queryClient = useQueryClient();
  const [newName, setNewName] = useState("");
  const [newCity, setNewCity] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editCity, setEditCity] = useState("");

  const { data: stores, isLoading } = useQuery({
    queryKey: ["stores"],
    queryFn: async () => {
      const { data, error } = await supabase.from("stores").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      const trimmedName = newName.trim();
      const trimmedCity = newCity.trim();
      if (!trimmedName || !trimmedCity) throw new Error("Nom et ville requis");
      const { error } = await supabase.from("stores").insert({ name: trimmedName, city: trimmedCity });
      if (error) throw error;
    },
    onSuccess: () => {
      setNewName("");
      setNewCity("");
      queryClient.invalidateQueries({ queryKey: ["stores"] });
      toast.success("Magasin créé !");
    },
    onError: (err) => toast.error((err as Error).message),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, name, city }: { id: string; name: string; city: string }) => {
      const { error } = await supabase.from("stores").update({ name, city }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      setEditingId(null);
      queryClient.invalidateQueries({ queryKey: ["stores"] });
      toast.success("Magasin mis à jour !");
    },
    onError: (err) => toast.error((err as Error).message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("stores").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stores"] });
      toast.success("Magasin supprimé !");
    },
    onError: (err) => toast.error((err as Error).message),
  });

  // Count employees per store
  const { data: employeeCounts } = useQuery({
    queryKey: ["store-employee-counts"],
    queryFn: async () => {
      const { data, error } = await supabase.from("employees").select("store_id").eq("is_active", true);
      if (error) throw error;
      const counts: Record<string, number> = {};
      (data ?? []).forEach((e) => {
        if (e.store_id) counts[e.store_id] = (counts[e.store_id] || 0) + 1;
      });
      return counts;
    },
  });

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
        <Store className="h-5 w-5" />
        Gestion des magasins
      </h2>

      {/* Add store */}
      <div className="kpi-card">
        <h3 className="text-sm font-semibold text-muted-foreground mb-3">Ajouter un magasin</h3>
        <div className="flex items-end gap-3 flex-wrap">
          <div className="flex-1 min-w-[180px]">
            <label className="text-xs text-muted-foreground">Nom</label>
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Fnac Bruxelles"
              className="mt-1"
            />
          </div>
          <div className="flex-1 min-w-[150px]">
            <label className="text-xs text-muted-foreground">Ville</label>
            <Input
              value={newCity}
              onChange={(e) => setNewCity(e.target.value)}
              placeholder="Bruxelles"
              className="mt-1"
            />
          </div>
          <Button size="sm" onClick={() => addMutation.mutate()} disabled={addMutation.isPending}>
            {addMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Plus className="h-3.5 w-3.5 mr-1" />}
            Ajouter
          </Button>
        </div>
      </div>

      {/* Store list */}
      <div className="kpi-card">
        <h3 className="text-sm font-semibold text-muted-foreground mb-3">
          Magasins ({stores?.length ?? 0})
        </h3>
        {isLoading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-1">
            {(stores ?? []).map((store) => {
              const isEditing = editingId === store.id;
              const count = employeeCounts?.[store.id] ?? 0;

              if (isEditing) {
                return (
                  <div key={store.id} className="flex items-center gap-2 py-2 px-2 rounded bg-muted/30 border">
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="h-8 text-sm flex-1"
                      placeholder="Nom"
                    />
                    <Input
                      value={editCity}
                      onChange={(e) => setEditCity(e.target.value)}
                      className="h-8 text-sm w-32"
                      placeholder="Ville"
                    />
                    <Button
                      size="sm"
                      onClick={() => updateMutation.mutate({ id: store.id, name: editName.trim(), city: editCity.trim() })}
                      disabled={updateMutation.isPending}
                    >
                      <Save className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                );
              }

              return (
                <div key={store.id} className="flex items-center justify-between py-2 px-2 rounded table-row-hover">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-accent/20 flex items-center justify-center">
                      <Store className="h-4 w-4 text-accent" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{store.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {store.city} · {count} collaborateur{count !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-muted-foreground hover:text-foreground"
                      onClick={() => {
                        setEditingId(store.id);
                        setEditName(store.name);
                        setEditCity(store.city);
                      }}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="text-destructive/60 hover:text-destructive">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Supprimer {store.name} ?</AlertDialogTitle>
                          <AlertDialogDescription>
                            {count > 0
                              ? `Ce magasin a ${count} collaborateur${count > 1 ? "s" : ""}. Ils seront détachés du magasin.`
                              : "Cette action est irréversible."}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Annuler</AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={() => deleteMutation.mutate(store.id)}
                          >
                            Supprimer
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              );
            })}
            {(stores ?? []).length === 0 && (
              <p className="text-sm text-muted-foreground py-4 text-center">Aucun magasin</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
