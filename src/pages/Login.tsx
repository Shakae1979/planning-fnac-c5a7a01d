import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Calendar, LogIn, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Login() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await signIn(email, password);
    if (error) setError("Email ou mot de passe incorrect");
    setLoading(false);
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: "hsl(var(--sidebar-bg))" }}
    >
      <Card className="w-full max-w-sm border-0 shadow-2xl">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-3 flex items-center justify-center gap-2">
            <Calendar className="h-7 w-7" style={{ color: "hsl(var(--sidebar-active))" }} />
            <span
              className="text-2xl font-extrabold tracking-tight"
              style={{ color: "hsl(var(--sidebar-active))" }}
            >
              fnac
            </span>
          </div>
          <CardTitle className="text-lg font-semibold text-foreground">
            Connexion au Planning
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@fnac.com"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
            {error && (
              <p className="text-sm text-destructive font-medium">{error}</p>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <LogIn className="h-4 w-4" />
              )}
              Se connecter
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
