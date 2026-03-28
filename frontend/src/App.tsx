import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuthContext } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { Toaster } from "@/components/ui/toaster";
import { AppLayout } from "@/components/layout/AppLayout";

// Public pages (no auth required)
import { LoginPage } from "@/pages/public/LoginPage";
import { RegisterPage } from "@/pages/public/RegisterPage";
import { MasterRegisterPage } from "@/pages/public/MasterRegisterPage";
import { MobileLayout } from "@/pages/public/MobileLayout";
import { SalonSelectorPage } from "@/pages/public/SalonSelectorPage";
import { MapPage } from "@/pages/public/MapPage";
import { SavedPage } from "@/pages/public/SavedPage";
import { UserProfilePage } from "@/pages/public/UserProfilePage";
import { ProviderProfilePage } from "@/pages/public/ProviderProfilePage";
import { MasterProfilePage } from "@/pages/public/MasterProfilePage";
import { PublicBookingPage } from "@/pages/public/PublicBookingPage";
import { MasterDiscoveryPage } from "@/pages/public/MasterDiscoveryPage";
import { FindProvidersPage } from "@/pages/public/FindProvidersPage";
import { FindProfessionalsPage } from "@/pages/public/FindProfessionalsPage";

// Private pages (auth required)
import { MasterDashboardPage } from "@/pages/private/MasterDashboardPage";
import { OwnerDashboardPage } from "@/pages/private/OwnerDashboardPage";
import { AdminPanelPage } from "@/pages/private/AdminPanelPage";
import { CalendarPage } from "@/pages/private/CalendarPage";
import { SessionsPage } from "@/pages/private/SessionsPage";
import { ServicesPage } from "@/pages/private/ServicesPage";
import { MastersPage } from "@/pages/private/MastersPage";
import { ReportsPage } from "@/pages/private/ReportsPage";
import { NotificationsPage } from "@/pages/private/NotificationsPage";
import { ReviewsPage } from "@/pages/private/ReviewsPage";
import { OwnerAnalyticsPage } from "@/pages/private/OwnerAnalyticsPage";
import { MasterAnalyticsPage } from "@/pages/private/MasterAnalyticsPage";
import { InvoicesPage } from "@/pages/private/InvoicesPage";
import { MasterProfileEditPage } from "@/pages/private/MasterProfileEditPage";
import { SalonProfileEditPage } from "@/pages/private/SalonProfileEditPage";
import { ProfessionalSplitPage } from "@/pages/private/ProfessionalSplitPage";
import { ClientsPage } from "@/pages/private/ClientsPage";
import { ClientDetailPage } from "@/pages/private/ClientDetailPage";

function DashboardRouter() {
  const { role } = useAuthContext();
  if (role === "provider_owner") return <OwnerDashboardPage />;
  if (role === "platform_admin") return <AdminPanelPage />;
  return <MasterDashboardPage />;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/register/professional" element={<MasterRegisterPage />} />
      <Route path="/register/master" element={<MasterRegisterPage />} />

      {/* Public discovery — tab layout */}
      <Route element={<MobileLayout />}>
        <Route path="/" element={<SalonSelectorPage />} />
        <Route path="/map" element={<MapPage />} />
        <Route path="/saved" element={<SavedPage />} />
        <Route path="/me" element={<UserProfilePage />} />
      </Route>

      {/* Detail + booking routes (no tab bar) */}
      <Route path="/providers/:providerId" element={<ProviderProfilePage />} />
      <Route path="/professionals/:professionalId" element={<MasterProfilePage />} />
      <Route path="/book/:providerId" element={<PublicBookingPage />} />
      <Route path="/book" element={<PublicBookingPage />} />

      {/* Backward-compat */}
      <Route path="/providers" element={<Navigate to="/" replace />} />
      <Route path="/salons" element={<Navigate to="/" replace />} />
      <Route path="/professionals/:professionalId/split" element={<ProfessionalSplitPage />} />
      <Route path="/masters/:masterId" element={<MasterProfilePage />} />
      <Route path="/discover" element={<MasterDiscoveryPage />} />
      <Route path="/find-providers" element={<FindProvidersPage />} />
      <Route path="/find-professionals" element={<FindProfessionalsPage />} />

      {/* Authenticated app routes */}
      <Route element={<AppLayout />}>
        <Route path="/dashboard" element={<DashboardRouter />} />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="/sessions" element={<SessionsPage />} />
        <Route path="/professionals" element={<MastersPage />} />
        <Route path="/masters" element={<MastersPage />} />
        <Route path="/services" element={<ServicesPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/reviews" element={<ReviewsPage />} />
        <Route path="/analytics/owner" element={<OwnerAnalyticsPage />} />
        <Route path="/analytics/professional" element={<MasterAnalyticsPage />} />
        <Route path="/analytics/master" element={<MasterAnalyticsPage />} />
        <Route path="/invoices" element={<InvoicesPage />} />
        <Route path="/clients" element={<ClientsPage />} />
        <Route path="/clients/:clientId" element={<ClientDetailPage />} />
        <Route path="/admin" element={<AdminPanelPage />} />
        <Route path="/profile/professional" element={<MasterProfileEditPage />} />
        <Route path="/profile/master" element={<MasterProfileEditPage />} />
        <Route path="/profile/provider" element={<SalonProfileEditPage />} />
        <Route path="/profile/salon" element={<SalonProfileEditPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
          <Toaster />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
