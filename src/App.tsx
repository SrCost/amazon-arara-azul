import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import "@/i18n/config";
import Index from "./pages/Index";
import Lodges from "./pages/Lodges";
import LodgeDetail from "./pages/LodgeDetail";
import Packages from "./pages/Packages";
import Sustainability from "./pages/Sustainability";
import HowToGetThere from "./pages/HowToGetThere";
import Contact from "./pages/Contact";
import FAQ from "./pages/FAQ";
import Auth from "./pages/Auth";
import ReservationSuccess from "./pages/ReservationSuccess";
import NotFound from "./pages/NotFound";
import Experiencias from "./pages/Experiencias";
import Checkin from "./pages/Checkin";
import Checkout from "./pages/Checkout";
import PreArrival from "./pages/PreArrival";
import FloatingSupportButton from "./components/FloatingSupportButton";
import LanguageSuggestionBanner from "./components/LanguageSuggestionBanner";
import FallingLeaves from "./components/FallingLeaves";

import AdminLayout from "./pages/admin/AdminLayout";
import Dashboard from "./pages/admin/Dashboard";
import Reservations from "./pages/admin/Reservations";
import Messages from "./pages/admin/Messages";
import Users from "./pages/admin/Users";
import Payments from "./pages/admin/Payments";
import Audit from "./pages/admin/Audit";
import AdminPackages from "./pages/admin/Packages";
import Gallery from "./pages/admin/Gallery";
import AdminBangalos from "./pages/admin/Bangalos";
import CalendarReservations from "./pages/admin/CalendarReservations";
import HeroCarouselAdmin from "./pages/admin/HeroCarousel";
import GuestAutomation from "./pages/admin/GuestAutomation";
import AdminFnrh from "./pages/admin/Fnrh";
import AdminExperiencias from "./pages/admin/Experiencias";
import AdminFormularios from "./pages/admin/Formularios";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <FallingLeaves />
          <Routes>

            <Route path="/" element={<Index />} />
            <Route path="/bangalos" element={<Lodges />} />
            <Route path="/bangalos/:id" element={<LodgeDetail />} />
            <Route path="/pacotes" element={<Packages />} />
            <Route path="/experiencias" element={<Experiencias />} />
            <Route path="/sustentabilidade" element={<Sustainability />} />
            <Route path="/como-chegar" element={<HowToGetThere />} />
            <Route path="/contato" element={<Contact />} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/reserva-concluida" element={<ReservationSuccess />} />
            <Route path="/reserva-sucesso" element={<ReservationSuccess />} />
            <Route path="/reserva-confirmada" element={<ReservationSuccess />} />
            <Route path="/reserva/sucesso" element={<ReservationSuccess />} />
            <Route path="/checkin" element={<Checkin />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/pre-chegada" element={<PreArrival />} />
            <Route
              path="/admin"
              element={
                <ProtectedRoute requiredRole="user" module="dashboard">
                  <AdminLayout>
                    <Dashboard />
                  </AdminLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/reservations"
              element={
                <ProtectedRoute requiredRole="user" module="reservations">
                  <AdminLayout>
                    <Reservations />
                  </AdminLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/messages"
              element={
                <ProtectedRoute requiredRole="user" module="messages">
                  <AdminLayout>
                    <Messages />
                  </AdminLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/packages"
              element={
                <ProtectedRoute requiredRole="admin" module="packages">
                  <AdminLayout>
                    <AdminPackages />
                  </AdminLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/gallery"
              element={
                <ProtectedRoute requiredRole="user" module="gallery">
                  <AdminLayout>
                    <Gallery />
                  </AdminLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/bangalos"
              element={
                <ProtectedRoute requiredRole="admin" module="bungalows">
                  <AdminLayout>
                    <AdminBangalos />
                  </AdminLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/fnrh"
              element={
                <ProtectedRoute requiredRole="admin" module="fnrh">
                  <AdminLayout>
                    <AdminFnrh />
                  </AdminLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/payments"
              element={
                <ProtectedRoute requiredRole="admin" module="payments">
                  <AdminLayout>
                    <Payments />
                  </AdminLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <ProtectedRoute requiredRole="super_admin" module="users">
                  <AdminLayout>
                    <Users />
                  </AdminLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/audit"
              element={
                <ProtectedRoute requiredRole="super_admin" module="audit">
                  <AdminLayout>
                    <Audit />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/calendario-reservas"
          element={
            <ProtectedRoute requiredRole="user" module="calendar">
              <AdminLayout>
                <CalendarReservations />
              </AdminLayout>
            </ProtectedRoute>
          }
            />
            <Route
              path="/admin/carrossel"
              element={
                <ProtectedRoute requiredRole="admin" module="carousel">
                  <AdminLayout>
                    <HeroCarouselAdmin />
                  </AdminLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/guest-automation"
              element={
                <ProtectedRoute requiredRole="admin" module="automation">
                  <AdminLayout>
                    <GuestAutomation />
                  </AdminLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/experiencias"
              element={
                <ProtectedRoute requiredRole="admin" module="experiences">
                  <AdminLayout>
                    <AdminExperiencias />
                  </AdminLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/formularios"
              element={
                <ProtectedRoute requiredRole="admin" module="forms">
                  <AdminLayout>
                    <AdminFormularios />
                  </AdminLayout>
                </ProtectedRoute>
              }
            />
            <Route path="/admin/hospedes" element={<Navigate to="/admin/fnrh" replace />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          <FloatingSupportButton />
          <LanguageSuggestionBanner />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
