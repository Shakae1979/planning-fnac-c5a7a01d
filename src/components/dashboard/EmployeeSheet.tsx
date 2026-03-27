import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, User } from "lucide-react";

const ROLES = [
  { value: "responsable", label: "Responsable" },
  { value: "technique", label: "Technique" },
  { value: "editorial", label: "Éditorial" },
  { value: "stock", label: "Stock" },
  { value: "caisse", label: "Caisse" },
  { value: "stagiaire", label: "Stagiaire" },
] as const;

interface Employee {
  id: string;
  name: string;
  email: string | null;
  role: string;
  contract_hours: number;
  is_active: boolean;
}

interface EmployeeSheetProps {
  employee: Employee | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EmployeeSheet({ employee, open, onOpenChange }: EmployeeSheetProps) {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("technique");
  const [hours, setHours] = useState("36");

  useEffect(() => {
    if (employee) {
      setName(employee.name);
      setEmail(employee.email || "");
      setRole(employee.role);
      setHours(String(employee.contract_hours));
    }
  }, [employee]);

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!employee) return;
      const trimmed = name.trim();
      if (!trimmed) throw new Error("Le nom est requis");
      const { error } = await supabase
        .from("employees")
        .update({
          name: trimmed,
          email: email.trim() || null,
          role,
          contract_hours: Number(hours) || 36,
        })
        .eq("id", employee.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      toast.success("Collaborateur mis à jour !");
      onOpenChange(false);
    },
    onError: (err) => toast.error((err as Error).message),
  });

  if (!employee) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-full bg-accent/20 flex items-center justify-center text-sm font-bold text-accent">
              {employee.name.charAt(0)}
            </div>
            Fiche collaborateur
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="emp-name">Nom</Label>
            <Input
              id="emp-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nom du collaborateur"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="emp-email">Email</Label>
            <Input
              id="emp-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@exemple.com"
            />
          </div>

          <div className="space-y-2">
            <Label>Département</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROLES.map((r) => (
                  <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="emp-hours">Heures contrat</Label>
            <Input
              id="emp-hours"
              type="number"
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              min={0}
              max={48}
              className="font-mono-data"
            />
          </div>

          <Button
            className="w-full mt-4"
            onClick={() => updateMutation.mutate()}
            disabled={updateMutation.isPending}
          >
            <Save className="h-4 w-4 mr-2" />
            Enregistrer
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
