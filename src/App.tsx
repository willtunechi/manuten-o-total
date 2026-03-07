import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppLayout } from "./components/layout/AppLayout";
import { DataProvider } from "./contexts/DataContext";
import { ConfigProvider } from "./contexts/ConfigContext";
import { useAuth } from "./hooks/useAuth";
import Auth from "./pages/Auth";
import ChangePassword from "./pages/ChangePassword";
import Dashboard from "./pages/Dashboard";
import Machines from "./pages/Machines";
import MachineDetail from "./pages/MachineDetail";
import Tickets from "./pages/Tickets";
import PreventivePlans from "./pages/PreventivePlans";
import Mechanics from "./pages/Mechanics";
import Inventory from "./pages/Inventory";
import Settings from "./pages/Settings";
import Purchases from "./pages/Purchases";
import StockEntries from "./pages/StockEntries";
import StockCount from "./pages/StockCount";
import Checklists from "./pages/Checklists";
import NotFound from "./pages/NotFound";
import ComponentDetail from "./pages/ComponentDetail";
import Lubrication from "./pages/Lubrication";
import Reports from "./pages/Reports";
const queryClient = new QueryClient();

function AppRoutes() {
  const { session, loading, mustChangePassword, role, canAccessRoute } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  if (!session) {
    return (
      <Routes>
        <Route path="/auth" element={<Auth />} />
        <Route path="*" element={<Navigate to="/auth" replace />} />
      </Routes>
    );
  }

  if (mustChangePassword) {
    return (
      <Routes>
        <Route path="/change-password" element={<ChangePassword />} />
        <Route path="*" element={<Navigate to="/change-password" replace />} />
      </Routes>
    );
  }

  return (
    <DataProvider>
      <ConfigProvider>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={canAccessRoute("/") ? <Dashboard /> : <Navigate to="/machines" replace />} />
            <Route path="/machines" element={<Machines />} />
            <Route path="/components/:id" element={<ComponentDetail />} />
            <Route path="/machines/:id" element={<MachineDetail />} />
            <Route path="/tickets" element={<Tickets />} />
            <Route path="/preventive-plans" element={<PreventivePlans />} />
            <Route path="/checklists" element={<Checklists />} />
            <Route path="/collaborators" element={<Mechanics />} />
            <Route path="/mechanics" element={<Mechanics />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/purchases" element={<Purchases />} />
            <Route path="/stock-entries" element={<StockEntries />} />
            <Route path="/stock-count" element={<StockCount />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/lubrication" element={<Lubrication />} />
            <Route path="/reports" element={<Reports />} />
          </Route>
          <Route path="/auth" element={<Navigate to="/" replace />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </ConfigProvider>
    </DataProvider>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
