import { lazy, Suspense, type ComponentType } from "react";
import { BrowserRouter, Routes, Route, Navigate, useSearchParams } from "react-router-dom";
import { AuthProvider, useAuthContext } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { Toaster } from "@/components/ui/toaster";
import { CookieConsent } from "@/components/shared/CookieConsent";
import { AppLayout } from "@/components/layout/AppLayout";
import { StandaloneLayout } from "@/components/layout/StandaloneLayout";
import { RouteFallback } from "@/components/shared/RouteFallback";

// Public pages (no auth required)
import { MobileLayout } from "@/pages/public/MobileLayout";

/** Route-level code splitting: every page except Discover (the landing screen) loads on demand. */
function lazyPage<K extends string>(load: () => Promise<Record<K, ComponentType>>, name: K) {
  return lazy(() => load().then((m) => ({ default: m[name] })));
}

const LoginPage = lazyPage(() => import("@/pages/public/LoginPage"), "LoginPage");
const MapPage = lazyPage(() => import("@/pages/public/MapPage"), "MapPage");
const SavedPage = lazyPage(() => import("@/pages/public/SavedPage"), "SavedPage");
const UserProfilePage = lazyPage(() => import("@/pages/public/UserProfilePage"), "UserProfilePage");
const ProviderProfilePage = lazyPage(() => import("@/pages/public/ProviderProfilePage"), "ProviderProfilePage");
const MasterProfilePage = lazyPage(() => import("@/pages/public/MasterProfilePage"), "MasterProfilePage");
const PublicBookingPage = lazyPage(() => import("@/pages/public/PublicBookingPage"), "PublicBookingPage");
const HelpPage = lazyPage(() => import("@/pages/public/HelpPage"), "HelpPage");
const TermsPage = lazyPage(() => import("@/pages/public/TermsPage"), "TermsPage");
const PrivacyPage = lazyPage(() => import("@/pages/public/PrivacyPage"), "PrivacyPage");
const ClientProfileEditPage = lazyPage(() => import("@/pages/public/ClientProfileEditPage"), "ClientProfileEditPage");
const ClientReviewsPage = lazyPage(() => import("@/pages/public/ClientReviewsPage"), "ClientReviewsPage");
const ClientBookingsPage = lazyPage(() => import("@/pages/public/ClientBookingsPage"), "ClientBookingsPage");
const MasterDiscoveryPage = lazyPage(() => import("@/pages/public/MasterDiscoveryPage"), "MasterDiscoveryPage");
const FindProvidersPage = lazyPage(() => import("@/pages/public/FindProvidersPage"), "FindProvidersPage");
const FindProfessionalsPage = lazyPage(() => import("@/pages/public/FindProfessionalsPage"), "FindProfessionalsPage");
const MasterDashboardPage = lazyPage(() => import("@/pages/private/MasterDashboardPage"), "MasterDashboardPage");
const OwnerDashboardPage = lazyPage(() => import("@/pages/private/OwnerDashboardPage"), "OwnerDashboardPage");
const TodayPage = lazyPage(() => import("@/pages/private/TodayPage"), "TodayPage");
const AdminPanelPage = lazyPage(() => import("@/pages/private/AdminPanelPage"), "AdminPanelPage");
const CalendarPage = lazyPage(() => import("@/pages/private/CalendarPage"), "CalendarPage");
const SessionsPage = lazyPage(() => import("@/pages/private/SessionsPage"), "SessionsPage");
const ServicesPage = lazyPage(() => import("@/pages/private/ServicesPage"), "ServicesPage");
const MastersPage = lazyPage(() => import("@/pages/private/MastersPage"), "MastersPage");
const ReportsPage = lazyPage(() => import("@/pages/private/ReportsPage"), "ReportsPage");
const NotificationsPage = lazyPage(() => import("@/pages/private/NotificationsPage"), "NotificationsPage");
const ReviewsPage = lazyPage(() => import("@/pages/private/ReviewsPage"), "ReviewsPage");
const OwnerAnalyticsPage = lazyPage(() => import("@/pages/private/OwnerAnalyticsPage"), "OwnerAnalyticsPage");
const MasterAnalyticsPage = lazyPage(() => import("@/pages/private/MasterAnalyticsPage"), "MasterAnalyticsPage");
const InvoicesPage = lazyPage(() => import("@/pages/private/InvoicesPage"), "InvoicesPage");
const MasterProfileEditPage = lazyPage(() => import("@/pages/private/MasterProfileEditPage"), "MasterProfileEditPage");
const SalonProfileEditPage = lazyPage(() => import("@/pages/private/SalonProfileEditPage"), "SalonProfileEditPage");
const ProfessionalSplitPage = lazyPage(() => import("@/pages/private/ProfessionalSplitPage"), "ProfessionalSplitPage");
const ClientsPage = lazyPage(() => import("@/pages/private/ClientsPage"), "ClientsPage");
const ClientDetailPage = lazyPage(() => import("@/pages/private/ClientDetailPage"), "ClientDetailPage");
import { SalonSelectorPage } from "@/pages/public/SalonSelectorPage";

// Private pages (auth required)

function ProRegisterRedirect() {
  const [searchParams] = useSearchParams();
  const invite = searchParams.get("invite");
  return <Navigate to={invite ? `/login?tab=pro&invite=${invite}` : "/login?tab=pro"} replace />;
}

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
      <Route element={<StandaloneLayout />}>
        <Route path="/login" element={<LoginPage />} />
      </Route>
      <Route path="/register" element={<Navigate to="/login?tab=business" replace />} />
      <Route path="/register/professional" element={<ProRegisterRedirect />} />
      <Route path="/register/master" element={<ProRegisterRedirect />} />
      <Route path="/register/client" element={<Navigate to="/login?tab=client" replace />} />

      {/* Public discovery — tab layout */}
      <Route element={<MobileLayout />}>
        <Route path="/" element={<SalonSelectorPage />} />
        <Route path="/map" element={<MapPage />} />
        <Route path="/saved" element={<SavedPage />} />
        <Route path="/me" element={<UserProfilePage />} />
      </Route>

      {/* Detail + booking routes (no tab bar) */}
      <Route element={<StandaloneLayout />}>
        <Route path="/help" element={<HelpPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/profile/client" element={<ClientProfileEditPage />} />
        <Route path="/reviews/client" element={<ClientReviewsPage />} />
        <Route path="/bookings/client" element={<ClientBookingsPage />} />
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
      </Route>

      {/* Authenticated app routes */}
      <Route element={<AppLayout />}>
        <Route path="/dashboard" element={<DashboardRouter />} />
        <Route path="/today" element={<TodayPage />} />
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
          <Suspense fallback={<RouteFallback fullScreen />}>
            <AppRoutes />
          </Suspense>
          <Toaster />
          <CookieConsent />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
