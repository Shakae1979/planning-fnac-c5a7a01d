import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, UserPlus, Users, Shield, User } from "lucide-react";

interface AppUser {
  id: string;
  email: string;
  role: string;
  created_at: string;
}

export function UserManager() {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<string>("user");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const callManageUsers = async (body: Record<string, unknown>) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error("Non connecté");
    
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
    if (!response.ok) throw new Error(data.error || "Erreur serveur");
    return data;
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await callManageUsers({ action: "list" });
      setUsers(data);
    } catch (e: any) {
      toast.error("Erreur lors du chargement des utilisateurs");
    }
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setCreating(true);
    try {
      await callManageUsers({ action: "create", email, password, role });
      toast.success("Utilisateur créé avec succès");
      setEmail("");
      setPassword("");
      setRole("user");
      setShowForm(false);
      fetchUsers();
    } catch (e: any) {
      toast.error(e.message || "Erreur lors de la création");
    }
    setCreating(false);
  };

  const handleDelete = async (userId: string) => {
    if (!confirm("Supprimer cet utilisateur ?")) return;
    setDeletingId(userId);
    try {
      await callManageUsers({ action: "delete", user_id: userId });
      toast.success("Utilisateur supprimé");
      fetchUsers();
    } catch (e: any) {
      toast.error(e.message || "Erreur lors de la suppression");
    }
    setDeletingId(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Users className="h-5 w-5" />
            Gestion des comptes
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Créer et gérer les accès au planning
          </p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} size="sm">
          <UserPlus className="h-4 w-4" />
          Nouveau compte
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Créer un compte</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="flex flex-wrap items-end gap-3">
              <div className="space-y-1.5 flex-1 min-w-[200px]">
                <Label htmlFor="new-email" className="text-xs">Email</Label>
                <Input
                  id="new-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nom@fnac.com"
                  required
                />
              </div>
              <div className="space-y-1.5 flex-1 min-w-[200px]">
                <Label htmlFor="new-password" className="text-xs">Mot de passe</Label>
                <Input
                  id="new-password"
                  type="text"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mot de passe"
                  required
                  minLength={6}
                />
              </div>
              <div className="space-y-1.5 w-[150px]">
                <Label className="text-xs">Rôle</Label>
                <Select value={role} onValueChange={setRole}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="user">Utilisateur</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" disabled={creating} size="sm">
                {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Créer
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="divide-y">
              {users.map((u) => (
                <div key={u.id} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="h-8 w-8 rounded-full flex items-center justify-center"
                      style={{
                        background: u.role === "admin"
                          ? "hsl(var(--sidebar-active) / 0.15)"
                          : "hsl(var(--muted))",
                      }}
                    >
                      {u.role === "admin" ? (
                        <Shield className="h-4 w-4" style={{ color: "hsl(var(--sidebar-active))" }} />
                      ) : (
                        <User className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{u.email}</p>
                      <p className="text-xs text-muted-foreground">
                        {u.role === "admin" ? "Administrateur" : "Utilisateur"} · Créé le{" "}
                        {new Date(u.created_at).toLocaleDateString("fr-BE")}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(u.id)}
                    disabled={deletingId === u.id}
                    className="text-destructive hover:text-destructive"
                  >
                    {deletingId === u.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              ))}
              {users.length === 0 && (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  Aucun utilisateur trouvé
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
