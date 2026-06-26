import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, KeyRound, Mail } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { toast } from "sonner";

const getResetRedirectUrl = () => {
  const PROD_URL = "https://planning.befnac.be";
  const isProd = window.location.hostname === "planning.befnac.be";
  return `${isProd ? window.location.origin : PROD_URL}/reset-password`;
};

const readAuthUrlParams = () => {
  const searchParams = new URLSearchParams(window.location.search);
  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));

  return {
    code: searchParams.get("code"),
    error: searchParams.get("error") || hashParams.get("error"),
    errorCode: searchParams.get("error_code") || hashParams.get("error_code"),
    errorDescription: searchParams.get("error_description") || hashParams.get("error_description"),
  };
};

export default function ResetPassword() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [checking, setChecking] = useState(true);
  const [needsNewLink, setNeedsNewLink] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const authUrlParams = useMemo(readAuthUrlParams, []);

  useEffect(() => {
    let mounted = true;

    const markReady = () => {
      if (!mounted) return;
      setReady(true);
      setNeedsNewLink(false);
      setChecking(false);
      window.history.replaceState({}, document.title, "/reset-password");
    };

    const markNeedsNewLink = () => {
      if (!mounted) return;
      setReady(false);
      setNeedsNewLink(true);
      setChecking(false);
    };

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session?.user) markReady();
    });

    const initialiseRecovery = async () => {
      if (authUrlParams.error || authUrlParams.errorCode || authUrlParams.errorDescription) {
        markNeedsNewLink();
        return;
      }

      if (authUrlParams.code) {
        const { error } = await supabase.auth.exchangeCodeForSession(authUrlParams.code);
        if (error) markNeedsNewLink();
        else markReady();
        return;
      }

      const { data } = await supabase.auth.getSession();
      if (data.session) markReady();
      else markNeedsNewLink();
    };

    initialiseRecovery();

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [authUrlParams.code, authUrlParams.error, authUrlParams.errorCode, authUrlParams.errorDescription]);

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

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResendLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: getResetRedirectUrl() });
    setResendLoading(false);
    if (error) {
      setError(t("reset.resendError"));
      return;
    }
    toast.success(t("reset.resendSuccess"));
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
          {checking ? (
            <div className="flex justify-center py-6">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : needsNewLink && !ready ? (
            <form onSubmit={handleResend} className="space-y-4">
              <p className="text-sm text-muted-foreground text-center">{t("reset.invalidLink")}</p>
              <div className="space-y-2">
                <Label htmlFor="reset-email">{t("login.email")}</Label>
                <Input
                  id="reset-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@be.fnac.com"
                  required
                  autoFocus
                />
              </div>
              {error && <p className="text-sm text-destructive font-medium">{error}</p>}
              <Button type="submit" className="w-full" disabled={resendLoading}>
                {resendLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                {t("reset.resend")}
              </Button>
              <Button type="button" variant="ghost" className="w-full" onClick={() => navigate("/login")}>
                {t("reset.backLogin")}
              </Button>
            </form>
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