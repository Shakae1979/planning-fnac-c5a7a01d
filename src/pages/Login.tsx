import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    const { error: signInError } = await signIn(email, password);

    if (signInError) {
      setError("Email ou mot de passe incorrect.");
      setIsLoading(false);
      return;
    }

    // Fetch profile to redirect based on role
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: prof } = await (supabase as any)
        .from("user_profiles")
        .select("role, employee_id, employees(name)")
        .eq("id", user.id)
        .single();

      if (prof?.role === "admin") {
        navigate("/");
      } else if (prof?.employee_id) {
        const { data: emp } = await supabase
          .from("employees")
          .select("name")
          .eq("id", prof.employee_id)
          .single();
        navigate(`/mon-planning/${encodeURIComponent(emp?.name ?? "")}`);
      } else {
        navigate("/mon-planning");
      }
    }

    setIsLoading(false);
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: "hsl(var(--background))" }}
    >
      <div className="w-full max-w-sm space-y-8">
        {/* Logo */}
        <div className="text-center space-y-2">
          <div
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mx-auto"
            style={{ background: "hsl(var(--sidebar-active))" }}
          >
            <span className="text-3xl font-black" style={{ color: "hsl(var(--accent-foreground))" }}>
              F
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Planning Fnac Charleroi</h1>
          <p className="text-sm text-muted-foreground">
            Connectez-vous pour accéder à votre planning
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Adresse email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="votre@email.com"
              required
              autoComplete="email"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Mot de passe</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Connexion en cours…" : "Se connecter"}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default Login;
