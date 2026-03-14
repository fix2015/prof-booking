import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuthContext } from "@/context/AuthContext";
import { Toaster } from "@/components/ui/toaster";
import { AppLayout } from "@/components/layout/AppLayout";
import { LoginPage } from "@/pages/LoginPage";
import { RegisterPage } from "@/pages/RegisterPage";
import { MasterRegisterPage } from "@/pages/MasterRegisterPage";
import { MasterDashboardPage } from "@/pages/MasterDashboardPage";
import { OwnerDashboardPage } from "@/pages/OwnerDashboardPage";
import { CalendarPage } from "@/pages/CalendarPage";
import { ReportsPage } from "@/pages/ReportsPage";
import { PublicBookingPage } from "@/pages/PublicBookingPage";
import { AdminPanelPage } from "@/pages/AdminPanelPage";
import { ServicesPage } from "@/pages/ServicesPage";
import { MastersPage } from "@/pages/MastersPage";
import { SessionsPage } from "@/pages/SessionsPage";
import { SalonSelectorPage } from "@/pages/SalonSelectorPage";
import { NotificationsPage } from "@/pages/NotificationsPage";
import { MasterProfilePage } from "@/pages/MasterProfilePage";
import { MasterDiscoveryPage } from "@/pages/MasterDiscoveryPage";
import { ReviewsPage } from "@/pages/ReviewsPage";
import { OwnerAnalyticsPage } from "@/pages/OwnerAnalyticsPage";
import { MasterAnalyticsPage } from "@/pages/MasterAnalyticsPage";
import { InvoicesPage } from "@/pages/InvoicesPage";
import { MasterProfileEditPage } from "@/pages/MasterProfileEditPage";
import { SalonProfileEditPage } from "@/pages/SalonProfileEditPage";

function DashboardRouter() {
  const { role } = useAuthContext();
  if (role === "salon_owner") return <OwnerDashboardPage />;
  if (role === "platform_admin") return <AdminPanelPage />;
  return <MasterDashboardPage />;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/register/master" element={<MasterRegisterPage />} />
      <Route path="/book" element={<PublicBookingPage />} />
      <Route path="/book/:salonId" element={<PublicBookingPage />} />
      <Route path="/salons" element={<SalonSelectorPage />} />
      <Route path="/masters/:masterId" element={<MasterProfilePage />} />
      <Route path="/discover" element={<MasterDiscoveryPage />} />

      {/* Authenticated app routes */}
      <Route element={<AppLayout />}>
        <Route path="/dashboard" element={<DashboardRouter />} />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="/sessions" element={<SessionsPage />} />
        <Route path="/masters" element={<MastersPage />} />
        <Route path="/services" element={<ServicesPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/reviews" element={<ReviewsPage />} />
        <Route path="/analytics/owner" element={<OwnerAnalyticsPage />} />
        <Route path="/analytics/master" element={<MasterAnalyticsPage />} />
        <Route path="/invoices" element={<InvoicesPage />} />
        <Route path="/admin" element={<AdminPanelPage />} />
        <Route path="/profile/master" element={<MasterProfileEditPage />} />
        <Route path="/profile/salon" element={<SalonProfileEditPage />} />
      </Route>

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
        <Toaster />
      </BrowserRouter>
    </AuthProvider>
  );
}
