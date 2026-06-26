import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, KeyRound } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { toast } from "sonner";

export default function ResetPassword() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [invalid, setInvalid] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setReady(true);
    });
    // Also check existing session (token may already be consumed)
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    const timer = setTimeout(() => {
      if (!ready) {
        supabase.auth.getSession().then(({ data }) => {
          if (!data.session) setInvalid(true);
        });
      }
    }, 1500);
    return () => {
      sub.subscription.unsubscribe();
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError(t("reset.tooShort"));
      return;
    }
    if (password !== confirm) {
      setError(t("reset.mismatch"));
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    toast.success(t("reset.success"));
    await supabase.auth.signOut();
    navigate("/login", { replace: true });
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 relative"
      style={{ background: "hsl(var(--sidebar-bg))" }}
    >
      <div className="absolute top-4 right-4">
        <LanguageSwitcher />
      </div>
      <Card className="w-full max-w-sm border-0 shadow-2xl">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-3 flex items-center justify-center gap-2">
            <img src="/favicon.png" alt="Planning Fnac" className="h-12 w-12" />
            <span className="text-2xl font-extrabold tracking-tight" style={{ color: "hsl(var(--sidebar-active))" }}>
              Planning Fnac
            </span>
          </div>
          <CardTitle className="text-lg font-semibold text-foreground">{t("reset.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          {invalid && !ready ? (
            <div className="space-y-4">
              <p className="text-sm text-destructive font-medium text-center">{t("reset.invalidLink")}</p>
              <Button className="w-full" onClick={() => navigate("/login")}>
                {t("login.submit")}
              </Button>
            </div>
          ) : !ready ? (
            <div className="flex justify-center py-6">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-pw">{t("reset.newPassword")}</Label>
                <Input id="new-pw" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoFocus />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-pw">{t("reset.confirmPassword")}</Label>
                <Input id="confirm-pw" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
              </div>
              {error && <p className="text-sm text-destructive font-medium">{error}</p>}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
                {t("reset.submit")}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}