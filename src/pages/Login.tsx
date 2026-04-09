import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { LogIn, Loader2, Users, Clock, BarChart3, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

  const features = [
    { icon: Users, label: "Gestion d'équipe" },
    { icon: Clock, label: "Planning hebdomadaire" },
    { icon: BarChart3, label: "Suivi des heures" },
    { icon: Calendar, label: "Gestion des congés" },
  ];

  return (
    <div className="min-h-screen flex" style={{ background: "hsl(var(--sidebar-bg))" }}>
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 relative overflow-hidden">
        {/* Decorative circles */}
        <div
          className="absolute -top-24 -left-24 w-96 h-96 rounded-full opacity-10"
          style={{ background: "hsl(var(--sidebar-active))" }}
        />
        <div
          className="absolute -bottom-32 -right-32 w-[500px] h-[500px] rounded-full opacity-[0.07]"
          style={{ background: "hsl(var(--sidebar-active))" }}
        />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <img src="/favicon.png" alt="Planning Fnac" className="h-10 w-10 rounded-xl" />
            <span
              className="text-2xl font-extrabold tracking-tight"
              style={{ color: "hsl(var(--sidebar-active))" }}
            >
              planning fnac
            </span>
          </div>
          <p className="text-sm mt-1" style={{ color: "hsl(var(--sidebar-fg) / 0.5)" }}>
            Outil de gestion des plannings
          </p>
        </div>

        <div className="relative z-10 space-y-6">
          <h2
            className="text-3xl font-bold leading-tight"
            style={{ color: "hsl(var(--sidebar-fg))" }}
          >
            Organisez votre équipe,
            <br />
            <span style={{ color: "hsl(var(--sidebar-active))" }}>simplement.</span>
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {features.map((f) => (
              <div
                key={f.label}
                className="flex items-center gap-3 rounded-lg px-4 py-3 transition-colors"
                style={{ background: "hsl(var(--sidebar-hover))" }}
              >
                <f.icon className="h-4 w-4 shrink-0" style={{ color: "hsl(var(--sidebar-active))" }} />
                <span className="text-sm font-medium" style={{ color: "hsl(var(--sidebar-fg))" }}>
                  {f.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        <p className="relative z-10 text-xs" style={{ color: "hsl(var(--sidebar-fg) / 0.3)" }}>
          © {new Date().getFullYear()} Fnac Belgique
        </p>
      </div>

      {/* Right panel — login form */}
      <div className="flex-1 flex items-center justify-center p-6 relative">
        <div className="absolute top-4 right-4">
          <LanguageSwitcher />
        </div>

        <div className="w-full max-w-sm">
          {/* Mobile-only branding */}
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center gap-2 mb-2">
              <img src="/favicon.png" alt="Planning Fnac" className="h-9 w-9 rounded-xl" />
              <span
                className="text-xl font-extrabold tracking-tight"
                style={{ color: "hsl(var(--sidebar-active))" }}
              >
                planning fnac
              </span>
            </div>
          </div>

          <div className="bg-card rounded-2xl shadow-2xl border-0 p-8">
            <div className="text-center mb-6">
              <h1 className="text-xl font-bold text-foreground">{t("login.title")}</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Entrez vos identifiants pour accéder au planning
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  {t("login.email")}
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@be.fnac.com"
                  className="h-11"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  {t("login.password")}
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="h-11"
                  required
                />
              </div>

              {error && (
                <div className="rounded-lg px-3 py-2" style={{ background: "hsl(var(--destructive) / 0.1)" }}>
                  <p className="text-sm text-destructive font-medium">{error}</p>
                </div>
              )}

              <Button type="submit" className="w-full h-11 text-sm font-semibold" disabled={loading}>
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <LogIn className="h-4 w-4 mr-2" />
                )}
                {t("login.submit")}
              </Button>
            </form>
          </div>

          <p
            className="text-center text-xs mt-6 lg:hidden"
            style={{ color: "hsl(var(--sidebar-fg) / 0.3)" }}
          >
            © {new Date().getFullYear()} Fnac Belgique
          </p>
        </div>
      </div>
    </div>
  );
}
