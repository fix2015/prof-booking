import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuthContext } from "@/context/AuthContext";
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

function DashboardRouter() {
  const { role } = useAuthContext();
  if (role === "salon_owner") return <OwnerDashboardPage />;
  if (role === "platform_admin") return <AdminPanelPage />;
  return <MasterDashboardPage />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/register/master" element={<MasterRegisterPage />} />
      <Route path="/book" element={<PublicBookingPage />} />
      <Route path="/book/:salonId" element={<PublicBookingPage />} />
      <Route path="/salons" element={<SalonSelectorPage />} />
      <Route element={<AppLayout />}>
        <Route path="/dashboard" element={<DashboardRouter />} />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="/sessions" element={<SessionsPage />} />
        <Route path="/masters" element={<MastersPage />} />
        <Route path="/services" element={<ServicesPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/admin" element={<AdminPanelPage />} />
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
      </BrowserRouter>
    </AuthProvider>
  );
}
