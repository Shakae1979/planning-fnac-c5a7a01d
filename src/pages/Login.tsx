import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { LogIn, Loader2, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useI18n } from "@/lib/i18n";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export default function Login() {
  const { signIn } = useAuth();
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await signIn(email, password);
    if (error) setError(t("login.error"));
    setLoading(false);
  };

  const forgotMailto = (() => {
    const subject = "Demande de réinitialisation de mot de passe / Wachtwoord reset aanvraag";
    const body = [
      "Bonjour Karim,",
      "",
      "Je souhaite réinitialiser mon mot de passe Planning Fnac.",
      "- Nom / Naam : ",
      "- Email du compte / E-mailadres : ",
      "- Magasin / Winkel : ",
      "",
      "Merci / Bedankt.",
    ].join("\n");
    return `mailto:karim.haoud@be.fnac.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  })();

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
          <CardTitle className="text-lg font-semibold text-foreground">{t("login.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{t("login.email")}</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@be.fnac.com"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t("login.password")}</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
            {error && <p className="text-sm text-destructive font-medium">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
              {t("login.submit")}
            </Button>
          </form>
          <div className="mt-4 text-center">
            <a
              href={forgotMailto}
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              <KeyRound className="h-3.5 w-3.5" />
              {t("login.forgot")}
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
