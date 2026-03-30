import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Save, Shield, PenTool, User, Loader2 } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { getDisplayName } from "@/lib/format";

const ROLE_KEYS = ["responsable", "technique", "editorial", "stock", "caisse", "stagiaire"] as const;

interface Employee {
  id: string;
  name: string;
  last_name?: string | null;
  email: string | null;
  role: string;
  contract_hours: number;
  is_active: boolean;
}

interface AppAccount {
  id: string;
  email: string;
  role: string;
}

interface EmployeeSheetProps {
  employee: Employee | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  account?: AppAccount | null;
  onUpdateAccountRole?: (userId: string, newRole: string) => Promise<void>;
}

export function EmployeeSheet({ employee, open, onOpenChange, account, onUpdateAccountRole }: EmployeeSheetProps) {
  const queryClient = useQueryClient();
  const { t } = useI18n();
  const [name, setName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("technique");
  const [hours, setHours] = useState("36");
  const [accessRole, setAccessRole] = useState("user");
  const [savingAccessRole, setSavingAccessRole] = useState(false);

  useEffect(() => {
    if (employee) {
      setName(employee.name);
      setLastName(employee.last_name || "");
      setEmail(employee.email || "");
      setRole(employee.role);
      setHours(String(employee.contract_hours));
    }
  }, [employee]);

  useEffect(() => {
    if (account) {
      setAccessRole(account.role);
    }
  }, [account]);

  const ACCESS_ROLES = [
    { value: "admin", label: t("access.admin"), icon: Shield, desc: t("access.admin.desc") },
    { value: "editor", label: t("access.editor"), icon: PenTool, desc: t("access.editor.desc") },
    { value: "user", label: t("access.user"), icon: User, desc: t("access.user.desc") },
  ] as const;

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!employee) return;
      const trimmedFirst = name.trim();
      const trimmedLast = lastName.trim();
      if (!trimmedFirst && !trimmedLast) throw new Error(t("misc.nameRequired"));
      const { error } = await supabase
        .from("employees")
        .update({
          name: trimmedFirst || trimmedLast,
          last_name: trimmedLast || null,
          email: email.trim() || null,
          role,
          contract_hours: Number(hours) || 36,
        })
        .eq("id", employee.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      toast.success(t("sheet.employeeUpdated"));
      onOpenChange(false);
    },
    onError: (err) => toast.error((err as Error).message),
  });

  const handleAccessRoleChange = async (newRole: string) => {
    if (!account || !onUpdateAccountRole) return;
    setAccessRole(newRole);
    setSavingAccessRole(true);
    try {
      await onUpdateAccountRole(account.id, newRole);
      toast.success(t("sheet.accessRoleUpdated"));
    } catch (e: any) {
      toast.error(e.message || "Error");
      setAccessRole(account.role);
    }
    setSavingAccessRole(false);
  };

  if (!employee) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-full bg-accent/20 flex items-center justify-center text-sm font-bold text-accent">
              {employee.name.charAt(0)}
            </div>
            {t("sheet.title")}
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="emp-name">{t("team.name")}</Label>
            <Input id="emp-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="emp-email">{t("team.email")}</Label>
            <Input id="emp-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@exemple.com" />
          </div>

          <div className="space-y-2">
            <Label>{t("team.department")}</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {ROLE_KEYS.map((r) => (
                  <SelectItem key={r} value={r}>{t(`role.${r}` as any)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="emp-hours">{t("team.contractHours")}</Label>
            <Input id="emp-hours" type="number" value={hours} onChange={(e) => setHours(e.target.value)} min={0} max={48} className="font-mono-data" />
          </div>

          <Button className="w-full" onClick={() => updateMutation.mutate()} disabled={updateMutation.isPending}>
            <Save className="h-4 w-4 mr-2" />
            {t("sheet.register")}
          </Button>

          {account && (
            <>
              <Separator />
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-semibold">{t("sheet.accessRole")}</Label>
                  {savingAccessRole && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
                </div>
                <div className="space-y-2">
                  {ACCESS_ROLES.map((ar) => {
                    const Icon = ar.icon;
                    const isSelected = accessRole === ar.value;
                    return (
                      <button
                        key={ar.value}
                        onClick={() => handleAccessRoleChange(ar.value)}
                        disabled={savingAccessRole}
                        className={`w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-colors ${
                          isSelected ? "border-accent bg-accent/10" : "border-border hover:border-accent/50 hover:bg-muted/50"
                        }`}
                      >
                        <Icon className={`h-4 w-4 shrink-0 ${isSelected ? "text-accent" : "text-muted-foreground"}`} />
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium ${isSelected ? "text-foreground" : "text-muted-foreground"}`}>{ar.label}</p>
                          <p className="text-[11px] text-muted-foreground">{ar.desc}</p>
                        </div>
                        {isSelected && <Badge variant="secondary" className="text-[10px] shrink-0">{t("misc.active")}</Badge>}
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {!account && employee.email && (
            <>
              <Separator />
              <p className="text-xs text-muted-foreground text-center">{t("sheet.noAccountYet")}</p>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
