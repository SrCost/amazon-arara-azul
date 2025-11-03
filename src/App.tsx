import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import "@/i18n/config";
import Index from "./pages/Index";
import Lodges from "./pages/Lodges";
import LodgeDetail from "./pages/LodgeDetail";
import Sustainability from "./pages/Sustainability";
import HowToGetThere from "./pages/HowToGetThere";
import Contact from "./pages/Contact";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import FloatingSupportButton from "./components/FloatingSupportButton";
import AdminLayout from "./pages/admin/AdminLayout";
import Dashboard from "./pages/admin/Dashboard";
import Reservations from "./pages/admin/Reservations";
import Messages from "./pages/admin/Messages";
import Users from "./pages/admin/Users";
import Payments from "./pages/admin/Payments";
import Audit from "./pages/admin/Audit";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/pousadas" element={<Lodges />} />
            <Route path="/pousadas/:id" element={<LodgeDetail />} />
            <Route path="/sustentabilidade" element={<Sustainability />} />
            <Route path="/como-chegar" element={<HowToGetThere />} />
            <Route path="/contato" element={<Contact />} />
            <Route path="/auth" element={<Auth />} />
            <Route
              path="/admin"
              element={
                <AdminLayout>
                  <Dashboard />
                </AdminLayout>
              }
            />
            <Route
              path="/admin/reservations"
              element={
                <AdminLayout>
                  <Reservations />
                </AdminLayout>
              }
            />
            <Route
              path="/admin/messages"
              element={
                <AdminLayout>
                  <Messages />
                </AdminLayout>
              }
            />
            <Route
              path="/admin/users"
              element={
                <AdminLayout>
                  <Users />
                </AdminLayout>
              }
            />
            <Route
              path="/admin/payments"
              element={
                <AdminLayout>
                  <Payments />
                </AdminLayout>
              }
            />
            <Route
              path="/admin/audit"
              element={
                <AdminLayout>
                  <Audit />
                </AdminLayout>
              }
            />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          <FloatingSupportButton />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
