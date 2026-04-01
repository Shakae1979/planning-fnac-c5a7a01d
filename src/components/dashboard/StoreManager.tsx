import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Plus, Trash2, Pencil, Store, X, Save, Loader2, UserPlus, UserMinus, Crown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/hooks/useAuth";

interface ManagerInfo {
  user_id: string;
  email: string;
  role: string;
  is_manager: boolean;
}

export function StoreManager() {
  const queryClient = useQueryClient();
  const { t } = useI18n();
  const { role: callerRole } = useAuth();
  const [newName, setNewName] = useState("");
  const [newCity, setNewCity] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editCity, setEditCity] = useState("");
  const [addingManagerStoreId, setAddingManagerStoreId] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [creatingManagerStoreId, setCreatingManagerStoreId] = useState<string | null>(null);
  const [newManagerEmail, setNewManagerEmail] = useState("");
  const [newManagerPassword, setNewManagerPassword] = useState("");

  const { data: stores, isLoading } = useQuery({
    queryKey: ["stores"],
    queryFn: async () => {
      const { data, error } = await supabase.from("stores").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: allUsers } = useQuery({
    queryKey: ["store-all-users"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("manage-users", {
        body: { action: "list" },
      });
      if (error) throw error;
      return (data || []) as { id: string; email: string; role: string; stores: { store_id: string; store_name: string; is_manager: boolean }[] }[];
    },
  });

  // Build managers map by store_id
  const storeManagers: Record<string, ManagerInfo[]> = {};
  if (allUsers) {
    for (const u of allUsers) {
      if (u.role === "editor" || u.role === "admin") {
        for (const s of u.stores || []) {
          if (!storeManagers[s.store_id]) storeManagers[s.store_id] = [];
          storeManagers[s.store_id].push({ user_id: u.id, email: u.email, role: u.role, is_manager: s.is_manager });
        }
      }
    }
  }

  const addMutation = useMutation({
    mutationFn: async () => {
      const trimmedName = newName.trim();
      const trimmedCity = newCity.trim();
      if (!trimmedName || !trimmedCity) throw new Error(t("store.nameAndCity"));
      const { error } = await supabase.from("stores").insert({ name: trimmedName, city: trimmedCity });
      if (error) throw error;
    },
    onSuccess: () => {
      setNewName(""); setNewCity("");
      queryClient.invalidateQueries({ queryKey: ["stores"] });
      toast.success(t("store.created"));
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
      toast.success(t("store.updated"));
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
      toast.success(t("store.deleted"));
    },
    onError: (err) => toast.error((err as Error).message),
  });

  const assignMutation = useMutation({
    mutationFn: async ({ user_id, store_id }: { user_id: string; store_id: string }) => {
      const { data, error } = await supabase.functions.invoke("manage-users", {
        body: { action: "assign_store", user_id, store_id },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
    },
    onSuccess: () => {
      setAddingManagerStoreId(null);
      setSelectedUserId("");
      queryClient.invalidateQueries({ queryKey: ["store-all-users"] });
      toast.success(t("store.managerAssigned"));
    },
    onError: (err) => toast.error((err as Error).message),
  });

  const unassignMutation = useMutation({
    mutationFn: async ({ user_id, store_id }: { user_id: string; store_id: string }) => {
      const { data, error } = await supabase.functions.invoke("manage-users", {
        body: { action: "unassign_store", user_id, store_id },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["store-all-users"] });
      toast.success(t("store.managerRemoved"));
    },
    onError: (err) => toast.error((err as Error).message),
  });
  const setManagerMutation = useMutation({
    mutationFn: async ({ user_id, store_id, is_manager }: { user_id: string; store_id: string; is_manager: boolean }) => {
      const { data, error } = await supabase.functions.invoke("manage-users", {
        body: { action: "set_manager", user_id, store_id, is_manager },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["store-all-users"] });
      toast.success(t("store.managerSet" as any));
    },
    onError: (err) => toast.error((err as Error).message),
  });

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

  // Editors/admins available to assign (not already assigned to this store)
  const getAvailableUsers = (storeId: string) => {
    const assigned = new Set((storeManagers[storeId] || []).map((m) => m.user_id));
    return (allUsers || []).filter(
      (u) => (u.role === "editor" || u.role === "admin") && !assigned.has(u.id)
    );
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
        <Store className="h-5 w-5" />
        {t("store.title")}
      </h2>

      <div className="kpi-card">
        <h3 className="text-sm font-semibold text-muted-foreground mb-3">{t("store.add")}</h3>
        <div className="flex items-end gap-3 flex-wrap">
          <div className="flex-1 min-w-[180px]">
            <label className="text-xs text-muted-foreground">{t("store.name")}</label>
            <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Fnac Bruxelles" className="mt-1" />
          </div>
          <div className="flex-1 min-w-[150px]">
            <label className="text-xs text-muted-foreground">{t("store.city")}</label>
            <Input value={newCity} onChange={(e) => setNewCity(e.target.value)} placeholder="Bruxelles" className="mt-1" />
          </div>
          <Button size="sm" onClick={() => addMutation.mutate()} disabled={addMutation.isPending}>
            {addMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Plus className="h-3.5 w-3.5 mr-1" />}
            {t("action.add")}
          </Button>
        </div>
      </div>

      <div className="kpi-card">
        <h3 className="text-sm font-semibold text-muted-foreground mb-3">
          {t("store.stores")} ({stores?.length ?? 0})
        </h3>
        {isLoading ? (
          <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        ) : (
          <div className="space-y-3">
            {(stores ?? []).map((store) => {
              const isEditing = editingId === store.id;
              const count = employeeCounts?.[store.id] ?? 0;
              const managers = storeManagers[store.id] || [];
              const isAddingManager = addingManagerStoreId === store.id;
              const availableUsers = getAvailableUsers(store.id);

              if (isEditing) {
                return (
                  <div key={store.id} className="flex items-center gap-2 py-2 px-2 rounded bg-muted/30 border">
                    <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="h-8 text-sm flex-1" placeholder={t("store.name")} />
                    <Input value={editCity} onChange={(e) => setEditCity(e.target.value)} className="h-8 text-sm w-32" placeholder={t("store.city")} />
                    <Button size="sm" onClick={() => updateMutation.mutate({ id: store.id, name: editName.trim(), city: editCity.trim() })} disabled={updateMutation.isPending}>
                      <Save className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                );
              }

              return (
                <div key={store.id} className="rounded-lg border bg-card p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-accent/20 flex items-center justify-center">
                        <Store className="h-4 w-4 text-accent" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{store.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {store.city} · {count} {t(count !== 1 ? "misc.collaborators" as any : "misc.collaborator" as any)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground"
                        onClick={() => { setEditingId(store.id); setEditName(store.name); setEditCity(store.city); }}>
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
                            <AlertDialogTitle>{t("store.deleteTitle")} {store.name}</AlertDialogTitle>
                            <AlertDialogDescription>
                              {count > 0
                                ? `${count} ${t("store.employeesDetached")}`
                                : t("store.irreversible")}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>{t("action.cancel")}</AlertDialogCancel>
                            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              onClick={() => deleteMutation.mutate(store.id)}>
                              {t("action.delete")}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>

                  {/* Managers section */}
                  <div className="pl-11 space-y-1">
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {t("store.managers")}
                    </div>
                    {managers.length === 0 && (
                      <p className="text-xs text-muted-foreground italic">{t("store.noManager")}</p>
                    )}
                    {managers.map((mgr) => (
                      <div key={mgr.user_id} className="flex items-center justify-between py-1 px-2 rounded bg-accent/5 text-xs group">
                        <span className="flex items-center gap-1.5">
                          {mgr.is_manager ? (
                            <Crown className="h-3.5 w-3.5 text-amber-500" />
                          ) : (
                            <span className="text-sm">👤</span>
                          )}
                          <span className="font-medium text-foreground">{mgr.email}</span>
                          <span className="text-muted-foreground">({mgr.role})</span>
                          {mgr.is_manager && (
                            <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 border-amber-500/50 text-amber-600">
                              Store Manager
                            </Badge>
                          )}
                        </span>
                        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          {callerRole === "admin" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className={`h-6 w-6 p-0 ${mgr.is_manager ? "text-amber-500 hover:text-amber-600" : "text-muted-foreground hover:text-amber-500"}`}
                              title={mgr.is_manager ? t("store.removeManager" as any) : t("store.setAsManager" as any)}
                              onClick={() => setManagerMutation.mutate({ user_id: mgr.user_id, store_id: store.id, is_manager: !mgr.is_manager })}
                              disabled={setManagerMutation.isPending}
                            >
                              <Crown className="h-3 w-3" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 text-destructive/50 hover:text-destructive"
                            onClick={() => unassignMutation.mutate({ user_id: mgr.user_id, store_id: store.id })}
                            disabled={unassignMutation.isPending}
                          >
                            <UserMinus className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}

                    {isAddingManager ? (
                      <div className="flex items-center gap-2 mt-1">
                        <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                          <SelectTrigger className="h-8 text-xs flex-1">
                            <SelectValue placeholder={t("store.selectUser")} />
                          </SelectTrigger>
                          <SelectContent>
                            {availableUsers.map((u) => (
                              <SelectItem key={u.id} value={u.id}>{u.email} ({u.role})</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          size="sm"
                          className="h-8"
                          disabled={!selectedUserId || assignMutation.isPending}
                          onClick={() => assignMutation.mutate({ user_id: selectedUserId, store_id: store.id })}
                        >
                          {assignMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                        </Button>
                        <Button size="sm" variant="ghost" className="h-8" onClick={() => { setAddingManagerStoreId(null); setSelectedUserId(""); }}>
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs text-accent hover:text-accent mt-1"
                        onClick={() => { setAddingManagerStoreId(store.id); setSelectedUserId(""); }}
                      >
                        <UserPlus className="h-3 w-3 mr-1" />
                        {t("store.addManager")}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
            {(stores ?? []).length === 0 && (
              <p className="text-sm text-muted-foreground py-4 text-center">{t("store.noStores")}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}