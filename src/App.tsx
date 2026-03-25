import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index.tsx";
import Login from "./pages/Login.tsx";
import EmployeeView from "./pages/EmployeeView.tsx";
import NotFound from "./pages/NotFound.tsx";
import TeamDayView from "./pages/TeamDayView.tsx";
import TeamWeekView from "./pages/TeamWeekView.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Page publique */}
            <Route path="/login" element={<Login />} />

            {/* Dashboard admin uniquement */}
            <Route
              path="/"
              element={
                <ProtectedRoute requireAdmin>
                  <Index />
                </ProtectedRoute>
              }
            />

            {/* Pages accessibles à tous les utilisateurs connectés */}
            <Route
              path="/mon-planning/:employeeName"
              element={
                <ProtectedRoute>
                  <EmployeeView />
                </ProtectedRoute>
              }
            />
            <Route
              path="/mon-planning"
              element={
                <ProtectedRoute>
                  <EmployeeView />
                </ProtectedRoute>
              }
            />
            <Route
              path="/equipe-du-jour"
              element={
                <ProtectedRoute>
                  <TeamDayView />
                </ProtectedRoute>
              }
            />
            <Route
              path="/planning-equipe"
              element={
                <ProtectedRoute>
                  <TeamWeekView />
                </ProtectedRoute>
              }
            />

            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
