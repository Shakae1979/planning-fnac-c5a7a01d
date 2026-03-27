import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { StoreProvider } from "@/hooks/useStore";
import Index from "./pages/Index.tsx";
import EmployeeView from "./pages/EmployeeView.tsx";
import NotFound from "./pages/NotFound.tsx";
import TeamDayView from "./pages/TeamDayView.tsx";
import TeamWeekView from "./pages/TeamWeekView.tsx";
import Login from "./pages/Login.tsx";
import { Loader2 } from "lucide-react";

const queryClient = new QueryClient();

function ProtectedRoute({ children, adminOnly = false }: { children: React.ReactNode; adminOnly?: boolean }) {
  const { user, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  // admin and editor can access dashboard
  if (adminOnly && role !== "admin" && role !== "editor") return <Navigate to="/equipe-du-jour" replace />;

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
      <Route path="/" element={<ProtectedRoute adminOnly><Index /></ProtectedRoute>} />
      <Route path="/mon-planning/:employeeName" element={<ProtectedRoute><EmployeeView /></ProtectedRoute>} />
      <Route path="/mon-planning" element={<ProtectedRoute><EmployeeView /></ProtectedRoute>} />
      <Route path="/equipe-du-jour" element={<ProtectedRoute><TeamDayView /></ProtectedRoute>} />
      <Route path="/planning-equipe" element={<ProtectedRoute><TeamWeekView /></ProtectedRoute>} />
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
        <AuthProvider>
          <StoreProvider>
            <AppRoutes />
          </StoreProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
