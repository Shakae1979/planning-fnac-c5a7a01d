import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { StoreProvider } from "@/hooks/useStore";
import { I18nProvider } from "@/lib/i18n";
import { ThemeProvider } from "@/hooks/useTheme";
import Index from "./pages/Index.tsx";
import EmployeeView from "./pages/EmployeeView.tsx";
import NotFound from "./pages/NotFound.tsx";
import TeamDayView from "./pages/TeamDayView.tsx";
import TeamWeekView from "./pages/TeamWeekView.tsx";
import CongesView from "./pages/CongesView.tsx";
import MyAccount from "./pages/MyAccount.tsx";
import Login from "./pages/Login.tsx";
import ResetPassword from "./pages/ResetPassword.tsx";
import ChangePassword from "./pages/ChangePassword.tsx";
import { Loader2 } from "lucide-react";
import { AppFooter } from "@/components/layout/AppFooter";

const queryClient = new QueryClient();

function ProtectedRoute({ children, adminOnly = false }: { children: React.ReactNode; adminOnly?: boolean }) {
  const { user, role, loading } = useAuth();
  const [mustChange, setMustChange] = React.useState<boolean | null>(null);
  const location = useLocation();

  React.useEffect(() => {
    if (!user?.email) return;
    supabase
      .from("employees")
      .select("must_change_password")
      .eq("email", user.email)
      .maybeSingle()
      .then(({ data }) => {
        setMustChange(data?.must_change_password === true);
      });
  }, [user?.email]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  // Redirect to password change if needed (but not if already on that page)
  if (mustChange === true && location.pathname !== "/changer-mot-de-passe") {
    return <Navigate to="/changer-mot-de-passe" replace />;
  }

  if (adminOnly && role !== "admin" && role !== "editor" && role !== "manager") return <Navigate to="/equipe-du-jour" replace />;

  return <>{children}</>;
}

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/changer-mot-de-passe" element={<ProtectedRoute><ChangePassword /></ProtectedRoute>} />
      <Route path="/" element={<ProtectedRoute adminOnly><Index /></ProtectedRoute>} />
      <Route path="/mon-planning/:employeeName" element={<ProtectedRoute><EmployeeView /></ProtectedRoute>} />
      <Route path="/mon-planning" element={<ProtectedRoute><EmployeeView /></ProtectedRoute>} />
      <Route path="/equipe-du-jour" element={<ProtectedRoute><TeamDayView /></ProtectedRoute>} />
      <Route path="/planning-equipe" element={<ProtectedRoute><TeamWeekView /></ProtectedRoute>} />
      <Route path="/conges" element={<ProtectedRoute><CongesView /></ProtectedRoute>} />
      <Route path="/mon-compte" element={<ProtectedRoute><MyAccount /></ProtectedRoute>} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <I18nProvider>
          <ThemeProvider>
            <AuthProvider>
              <StoreProvider>
                <AppRoutes />
                <AppFooter />
              </StoreProvider>
            </AuthProvider>
          </ThemeProvider>
        </I18nProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
