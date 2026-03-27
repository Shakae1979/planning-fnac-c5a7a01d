import { useState, useEffect } from "react";
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
import {
  Plus, Trash2, Mail, X, Users, Shield, User, Loader2, KeyRound, UserPlus, PenTool, RotateCcw,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useStore } from "@/hooks/useStore";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/lib/i18n";
import { EmployeeSheet } from "./EmployeeSheet";

const ROLE_KEYS = ["responsable", "technique", "editorial", "stock", "caisse", "stagiaire"] as const;
const ROLE_COLORS: Record<string, string> = {
  responsable: "bg-orange-100 text-orange-800",
  technique: "bg-blue-100 text-blue-800",
  editorial: "bg-purple-100 text-purple-800",
  stock: "bg-amber-100 text-amber-800",
  caisse: "bg-emerald-100 text-emerald-800",
  stagiaire: "bg-pink-100 text-pink-800",
};

interface AppUser {
  id: string;
  email: string;
  role: string;
  created_at: string;
}

export function TeamAndAccounts() {
  const queryClient = useQueryClient();
  const { currentStore } = useStore();
  const { role: myRole } = useAuth();
  const { t } = useI18n();
  const [newName, setNewName] = useState("");
  const [newHours, setNewHours] = useState("36");
  const [newRole, setNewRole] = useState("technique");
  const [newEmail, setNewEmail] = useState("");

  // Account creation state per employee
  const [creatingForId, setCreatingForId] = useState<string | null>(null);
  const [accountPassword, setAccountPassword] = useState("");
  const [accountRole, setAccountRole] = useState<string>("user");
  const [savingAccount, setSavingAccount] = useState(false);
  const [deletingAccountId, setDeletingAccountId] = useState<string | null>(null);
  const [editingEmployee, setEditingEmployee] = useState<any>(null);

  // Fetch employees filtered by store
  const { data: employees } = useQuery({
    queryKey: ["employees", currentStore?.id],
    queryFn: async () => {
      let query = supabase.from("employees").select("*").order("name");
      if (currentStore) {
        query = query.eq("store_id", currentStore.id);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  // Fetch user accounts
  const [accounts, setAccounts] = useState<AppUser[]>([]);
  const [accountsLoading, setAccountsLoading] = useState(true);

  // Fetch store assignments to filter accounts by current store
  const { data: storeAssignments } = useQuery({
    queryKey: ["user-store-assignments", currentStore?.id],
    queryFn: async () => {
      if (!currentStore) return [];
      const { data, error } = await supabase
        .from("user_store_assignments")
        .select("user_id")
        .eq("store_id", currentStore.id);
      if (error) throw error;
      return data;
    },
    enabled: !!currentStore,
  });

  const callManageUsers = async (body: Record<string, unknown>) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error(t("team.notConnected" as any));
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-users`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
          "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify(body),
      }
    );
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || t("team.serverError" as any));
    return data;
  };

  const fetchAccounts = async () => {
    setAccountsLoading(true);
    try {
      const data = await callManageUsers({ action: "list" });
      setAccounts(data);
    } catch {
      // silently fail
    }
    setAccountsLoading(false);
  };

  useEffect(() => { fetchAccounts(); }, []);

  // Match accounts to employees by email
  const getAccountForEmployee = (email: string | null) => {
    if (!email) return null;
    return accounts.find((a) => a.email.toLowerCase() === email.toLowerCase()) || null;
  };

  // Employee mutations
  const addMutation = useMutation({
    mutationFn: async () => {
      const trimmed = newName.trim();
      if (!trimmed) throw new Error(t("team.nameRequired" as any));
      const { error } = await supabase.from("employees").insert({
        name: trimmed,
        contract_hours: Number(newHours) || 36,
        role: newRole,
        email: newEmail.trim() || null,
        store_id: currentStore?.id || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setNewName(""); setNewHours("36"); setNewRole("technique"); setNewEmail("");
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      toast.success(t("team.employeeAdded" as any));
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
      toast.success(t("team.employeeUpdated" as any));
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ id, role }: { id: string; role: string }) => {
      const { error } = await supabase.from("employees").update({ role }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      toast.success(t("team.departmentUpdated" as any));
    },
  });

  const updateEmailMutation = useMutation({
    mutationFn: async ({ id, email }: { id: string; email: string }) => {
      const { error } = await supabase.from("employees").update({ email: email || null }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      toast.success(t("team.emailUpdated" as any));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("employees").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      toast.success(t("team.employeeDeleted" as any));
    },
  });

  // Account actions
  const handleCreateAccount = async (employeeEmail: string) => {
    if (!accountPassword || accountPassword.length < 6) {
      toast.error(t("team.passwordMinChars" as any));
      return;
    }
    setSavingAccount(true);
    try {
      await callManageUsers({ action: "create", email: employeeEmail, password: accountPassword, role: accountRole, store_id: currentStore?.id });
      toast.success(t("team.accountCreated" as any));
      setCreatingForId(null);
      setAccountPassword("");
      setAccountRole("user");
      fetchAccounts();
    } catch (e: any) {
      toast.error(e.message || t("team.errorCreating" as any));
    }
    setSavingAccount(false);
  };

  const handleDeleteAccount = async (userId: string) => {
    if (!confirm(t("team.deleteAccountConfirm" as any))) return;
    setDeletingAccountId(userId);
    try {
      await callManageUsers({ action: "delete", user_id: userId });
      toast.success(t("team.accountDeleted" as any));
      fetchAccounts();
    } catch (e: any) {
      toast.error(e.message || t("team.serverError" as any));
    }
    setDeletingAccountId(null);
  };

  const roleOrder = ["responsable", "technique", "editorial", "stock", "caisse"];
  const active = (employees?.filter((e) => e.is_active) ?? []).sort((a, b) => {
    const ra = roleOrder.indexOf(a.role);
    const rb = roleOrder.indexOf(b.role);
    if (ra !== rb) return (ra === -1 ? 99 : ra) - (rb === -1 ? 99 : rb);
    return a.name.localeCompare(b.name);
  });
  const inactive = employees?.filter((e) => !e.is_active) ?? [];

  // Find accounts not linked to any employee in this store, but assigned to this store
  const employeeEmails = new Set((employees ?? []).filter(e => e.email).map(e => e.email!.toLowerCase()));
  const assignedUserIds = new Set((storeAssignments ?? []).map(a => a.user_id));
  const orphanAccounts = accounts.filter(a => 
    !employeeEmails.has(a.email.toLowerCase()) && assignedUserIds.has(a.id)
  );

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
        <Users className="h-5 w-5" />
        {t("team.title" as any)}
      </h2>

      {/* Add employee */}
      <div className="kpi-card">
        <h3 className="text-sm font-semibold text-muted-foreground mb-3">{t("team.addEmployee" as any)}</h3>
        <div className="flex items-end gap-3 flex-wrap">
          <div className="flex-1 min-w-[150px]">
            <label className="text-xs text-muted-foreground">{t("team.name" as any)}</label>
            <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)}
              placeholder={t("team.firstName" as any)} maxLength={100}
              className="w-full mt-1 px-3 py-2 text-sm rounded-md border bg-background focus:outline-none focus:ring-2 focus:ring-accent" />
          </div>
          <div className="w-48">
            <label className="text-xs text-muted-foreground">{t("team.email" as any)}</label>
            <input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)}
              placeholder="email@exemple.com"
              className="w-full mt-1 px-3 py-2 text-sm rounded-md border bg-background focus:outline-none focus:ring-2 focus:ring-accent" />
          </div>
          <div className="w-32">
            <label className="text-xs text-muted-foreground">{t("team.contractHours" as any)}</label>
            <input type="number" value={newHours} onChange={(e) => setNewHours(e.target.value)}
              className="w-full mt-1 px-3 py-2 text-sm rounded-md border bg-background focus:outline-none focus:ring-2 focus:ring-accent font-mono-data" />
          </div>
          <div className="w-40">
            <label className="text-xs text-muted-foreground">{t("team.department" as any)}</label>
            <select value={newRole} onChange={(e) => setNewRole(e.target.value)}
              className="w-full mt-1 px-3 py-2 text-sm rounded-md border bg-background focus:outline-none focus:ring-2 focus:ring-accent">
              {ROLE_KEYS.map((r) => <option key={r} value={r}>{t(`role.${r}.short` as any)}</option>)}
            </select>
          </div>
          <Button size="sm" onClick={() => addMutation.mutate()} disabled={addMutation.isPending}>
            <Plus className="h-3.5 w-3.5 mr-1" /> {t("action.add" as any)}
          </Button>
        </div>
      </div>

      {/* Active employees */}
      <div className="kpi-card">
        <h3 className="text-sm font-semibold text-muted-foreground mb-3">
          {t("team.activeEmployees" as any)} ({active.length})
        </h3>
        <div className="space-y-1">
          {active.map((emp) => {
            const account = getAccountForEmployee(emp.email);
            const isCreating = creatingForId === emp.id;

            return (
              <div key={emp.id} className="py-2 px-2 rounded table-row-hover">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-accent/20 flex items-center justify-center text-xs font-bold text-accent">
                      {emp.name.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <button className="text-sm font-medium hover:underline cursor-pointer text-left" onClick={() => setEditingEmployee(emp)}>{emp.name}</button>
                        {account ? (
                          <Badge variant="outline" className="text-[10px] gap-1 py-0">
                            {account.role === "admin" ? <Shield className="h-3 w-3" /> : account.role === "editor" ? <PenTool className="h-3 w-3" /> : <User className="h-3 w-3" />}
                            {account.role === "admin" ? t("access.admin" as any) : account.role === "editor" ? t("access.editor" as any) : t("access.user" as any)}
                          </Badge>
                        ) : emp.email ? (
                          <Badge variant="secondary" className="text-[10px] py-0 text-muted-foreground">
                            {t("team.noAccount" as any)}
                          </Badge>
                        ) : null}
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <select value={emp.role}
                          onChange={(e) => updateRoleMutation.mutate({ id: emp.id, role: e.target.value })}
                          className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium border-none cursor-pointer ${ROLE_COLORS[emp.role] ?? "bg-muted text-muted-foreground"}`}>
                          {ROLE_KEYS.map((r) => <option key={r} value={r}>{t(`role.${r}.short` as any)}</option>)}
                        </select>
                        {" · "}<span className="font-mono-data">{emp.contract_hours}h</span>
                      </div>
                      <div className="flex items-center gap-1 mt-0.5">
                        <Mail className="h-3 w-3 text-muted-foreground" />
                        <input type="email" defaultValue={emp.email || ""} placeholder="email@exemple.com"
                          className="text-[11px] bg-transparent border-none outline-none text-muted-foreground w-48 focus:text-foreground"
                          onBlur={(e) => {
                            const val = e.target.value.trim();
                            if (val !== (emp.email || "")) {
                              updateEmailMutation.mutate({ id: emp.id, email: val });
                            }
                          }} />
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {/* Account actions */}
                    {account ? (
                      <>
                        <Button variant="ghost" size="sm"
                          className="text-xs gap-1"
                          onClick={async () => {
                            try {
                              const { error } = await supabase.auth.resetPasswordForEmail(account.email, {
                                redirectTo: `${window.location.origin}/reset-password`,
                              });
                              if (error) throw error;
                              toast.success(t("team.resetEmailSent" as any));
                            } catch (e: any) {
                              toast.error(e.message || t("team.serverError" as any));
                            }
                          }}>
                          <RotateCcw className="h-3.5 w-3.5" />
                          {t("team.resetPassword" as any)}
                        </Button>
                        <Button variant="ghost" size="sm"
                          className="text-destructive/60 hover:text-destructive text-xs gap-1"
                          onClick={() => handleDeleteAccount(account.id)}
                          disabled={deletingAccountId === account.id}>
                          {deletingAccountId === account.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <KeyRound className="h-3.5 w-3.5" />}
                          {t("team.deleteAccount" as any)}
                        </Button>
                      </>
                    ) : emp.email ? (
                      <Button variant="outline" size="sm" className="text-xs gap-1"
                        onClick={() => { setCreatingForId(isCreating ? null : emp.id); setAccountPassword(""); setAccountRole("user"); }}>
                        <UserPlus className="h-3.5 w-3.5" />
                        {t("team.createAccount" as any)}
                      </Button>
                    ) : null}
                    <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive"
                      onClick={() => toggleMutation.mutate({ id: emp.id, active: false })}>
                      <Trash2 className="h-3.5 w-3.5 mr-1" /> {t("action.deactivate" as any)}
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="text-destructive/60 hover:text-destructive">
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>{t("team.deleteConfirmTitle" as any)} {emp.name} ?</AlertDialogTitle>
                          <AlertDialogDescription>
                            {t("team.deleteConfirmDesc" as any)}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>{t("action.cancel" as any)}</AlertDialogCancel>
                          <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={() => deleteMutation.mutate(emp.id)}>
                            {t("action.deletePermanent" as any)}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>

                {/* Inline account creation form */}
                {isCreating && (
                  <div className="mt-2 ml-11 flex items-end gap-2 p-2 rounded-md border bg-muted/30">
                     <div className="flex-1 min-w-[150px]">
                      <label className="text-xs text-muted-foreground">{t("team.password" as any)}</label>
                      <Input type="text" value={accountPassword} onChange={(e) => setAccountPassword(e.target.value)}
                        placeholder={t("team.minChars" as any)} className="h-8 text-sm mt-1" />
                    </div>
                    <div className="w-[130px]">
                      <label className="text-xs text-muted-foreground">{t("team.accountRole" as any)}</label>
                      <Select value={accountRole} onValueChange={setAccountRole}>
                        <SelectTrigger className="h-8 text-sm mt-1"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {myRole === "admin" && <SelectItem value="admin">{t("access.admin" as any)}</SelectItem>}
                          {myRole === "admin" && <SelectItem value="editor">{t("access.editor" as any)}</SelectItem>}
                          <SelectItem value="user">{t("access.user" as any)}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button size="sm" disabled={savingAccount} onClick={() => handleCreateAccount(emp.email!)}>
                      {savingAccount ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                      {t("team.create" as any)}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setCreatingForId(null)}>
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Inactive employees */}
      {inactive.length > 0 && (
        <div className="kpi-card">
          <h3 className="text-sm font-semibold text-muted-foreground mb-3">{t("team.inactive" as any)} ({inactive.length})</h3>
          <div className="space-y-1">
            {inactive.map((emp) => (
              <div key={emp.id} className="flex items-center justify-between py-2 px-2 rounded table-row-hover opacity-60">
                <span className="text-sm">{emp.name}</span>
                <div className="flex items-center gap-1">
                  <Button variant="outline" size="sm" onClick={() => toggleMutation.mutate({ id: emp.id, active: true })}>{t("action.reactivate" as any)}</Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="text-destructive/60 hover:text-destructive"><X className="h-3.5 w-3.5" /></Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>{t("team.deleteConfirmTitle" as any)} {emp.name} ?</AlertDialogTitle>
                        <AlertDialogDescription>{t("conges.irreversible" as any)}</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>{t("action.cancel" as any)}</AlertDialogCancel>
                        <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          onClick={() => deleteMutation.mutate(emp.id)}>{t("action.delete" as any)}</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Orphan accounts (not linked to any employee) */}
      {orphanAccounts.length > 0 && (
        <div className="kpi-card">
          <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
            <Shield className="h-4 w-4" />
            {t("team.orphanAccounts" as any)} ({orphanAccounts.length})
          </h3>
          <p className="text-xs text-muted-foreground mb-3">
            {t("team.orphanDesc" as any)}
          </p>
          <div className="space-y-1">
            {orphanAccounts.map((a) => (
              <div key={a.id} className="flex items-center justify-between py-2 px-2 rounded table-row-hover">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full flex items-center justify-center"
                    style={{ background: a.role === "admin" ? "hsl(var(--sidebar-active) / 0.15)" : "hsl(var(--muted))" }}>
                    {a.role === "admin" ? <Shield className="h-4 w-4" style={{ color: "hsl(var(--sidebar-active))" }} /> : <User className="h-4 w-4 text-muted-foreground" />}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{a.email}</p>
                     <p className="text-xs text-muted-foreground">
                      {a.role === "admin" ? t("users.administrator" as any) : t("access.user" as any)} · {new Date(a.created_at).toLocaleDateString("fr-BE")}
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => handleDeleteAccount(a.id)}
                  disabled={deletingAccountId === a.id} className="text-destructive hover:text-destructive">
                  {deletingAccountId === a.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      <EmployeeSheet
        employee={editingEmployee}
        open={!!editingEmployee}
        onOpenChange={(open) => { if (!open) setEditingEmployee(null); }}
        account={editingEmployee ? getAccountForEmployee(editingEmployee.email) : null}
        onUpdateAccountRole={async (userId, newRole) => {
          await callManageUsers({ action: "update_role", user_id: userId, role: newRole });
          fetchAccounts();
        }}
      />
    </div>
  );
}
