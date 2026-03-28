import { useNavigate } from "react-router-dom";
import { useAuthContext } from "@/context/AuthContext";
import { useLogout } from "@/hooks/useAuth";
import { useGuestSession } from "@/hooks/useGuestSession";
import { AppHeader } from "@/components/mobile/AppHeader";
import { t } from "@/i18n";

function IconCircle({ children }: { children: React.ReactNode }) {
  return (
    <div className="size-[36px] rounded-full bg-ds-bg-secondary flex items-center justify-center shrink-0 text-ds-text-secondary">
      {children}
    </div>
  );
}

function ChevronRight() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-ds-text-muted shrink-0">
      <path d="M6 4L10 8L6 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

interface MenuRowProps {
  icon: React.ReactNode;
  label: string;
  subtitle?: string;
  onClick: () => void;
}

function MenuRow({ icon, label, subtitle, onClick }: MenuRowProps) {
  const height = subtitle ? "h-[58px]" : "h-[56px]";
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-ds-3 px-ds-4 ${height} border-b border-ds-border last:border-b-0 active:bg-ds-bg-secondary`}
    >
      <IconCircle>{icon}</IconCircle>
      <div className="flex-1 flex flex-col items-start min-w-0">
        <span className="ds-body-strong text-ds-text-primary">{label}</span>
        {subtitle && <span className="ds-caption text-ds-text-secondary">{subtitle}</span>}
      </div>
      <ChevronRight />
    </button>
  );
}

function InitialsAvatar({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() || "G";
  return (
    <div className="size-[72px] rounded-[10px] bg-ds-avatar-navy flex items-center justify-center shrink-0">
      <span className="text-[28px] font-semibold text-ds-text-inverse leading-none">{initials}</span>
    </div>
  );
}

export function UserProfilePage() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthContext();
  const logout = useLogout();
  const { guestProfile, guestBookings } = useGuestSession();

  const displayName = isAuthenticated && user
    ? (user.email.split("@")[0])
    : (guestProfile?.name || t("profile.guest"));

  // For guests: count from localStorage; for auth users: not shown (needs API)
  const guestUpcomingCount = !isAuthenticated ? guestBookings.length : null;

  const SettingsButton = (
    <button className="size-[32px] rounded-full bg-ds-bg-secondary flex items-center justify-center text-ds-text-primary">
      <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
        <circle cx="10" cy="10" r="2" stroke="currentColor" strokeWidth="1.5" />
        <path d="M10 2v2M10 16v2M2 10h2M16 10h2M4.22 4.22l1.42 1.42M14.36 14.36l1.42 1.42M4.22 15.78l1.42-1.42M14.36 5.64l1.42-1.42" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    </button>
  );

  const outerBg = isAuthenticated ? "bg-ds-bg-primary" : "bg-ds-bg-secondary";

  return (
    <div className={`flex flex-col min-h-full ${outerBg}`}>
      <AppHeader variant="title-action" title={t("profile.page_title")} rightElement={SettingsButton} />

      {/* Profile card */}
      <div className="bg-ds-bg-primary border border-ds-border flex flex-col items-center gap-[6px] pt-6 pb-5">
        <InitialsAvatar name={displayName} />
        <p className="ds-h4 text-ds-text-primary mt-[2px]">{displayName}</p>

        {isAuthenticated && user ? (
          <div className="flex items-center gap-[6px]">
            <span className="ds-body-small text-ds-text-muted">{user.email}</span>
            <button
              onClick={() => navigate("/profile/professional")}
              className="ds-label text-ds-text-primary"
            >
              · {t("profile.edit")}
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-ds-2 mt-ds-1">
            <button
              onClick={() => navigate("/login")}
              className="h-[44px] px-ds-6 bg-ds-interactive rounded-ds-2xl ds-body-strong text-ds-text-inverse"
            >
              {t("profile.sign_in_cta")}
            </button>
            <button
              onClick={() => navigate("/register/client")}
              className="ds-body-small text-ds-interactive"
            >
              {t("profile.create_account")}
            </button>
          </div>
        )}
      </div>

      {/* Menu */}
      <div className={`bg-ds-bg-primary border border-ds-border ${isAuthenticated ? "" : "mt-ds-3"}`}>
        <MenuRow
          icon={
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <rect x="2" y="3" width="14" height="13" rx="2" stroke="currentColor" strokeWidth="1.4" />
              <path d="M6 1V5M12 1V5M2 8H16" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
          }
          label={t("profile.my_bookings")}
          subtitle={
            guestUpcomingCount !== null
              ? guestUpcomingCount > 0
                ? t("profile.guest_bookings_count", { count: String(guestUpcomingCount) })
                : t("profile.no_bookings")
              : undefined
          }
          onClick={() => navigate("/sessions")}
        />
        {isAuthenticated && (
          <MenuRow
            icon={
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M9 2L11.09 6.26L16 7.27L12.5 10.67L13.18 15.59L9 13.36L4.82 15.59L5.5 10.67L2 7.27L6.91 6.26L9 2Z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            }
            label={t("profile.my_reviews")}
            onClick={() => {}}
          />
        )}
        {isAuthenticated && (
          <MenuRow
            icon={
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <rect x="1" y="4" width="16" height="11" rx="2" stroke="currentColor" strokeWidth="1.4" />
                <path d="M1 8H17" stroke="currentColor" strokeWidth="1.4" />
              </svg>
            }
            label={t("profile.payment_methods")}
            onClick={() => {}}
          />
        )}
        {isAuthenticated && (
          <MenuRow
            icon={
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M9 2C6.239 2 4 4.239 4 7V11L2 13H16L14 11V7C14 4.239 11.761 2 9 2Z" stroke="currentColor" strokeWidth="1.4" />
                <path d="M7 13C7 14.105 7.895 15 9 15C10.105 15 11 14.105 11 13" stroke="currentColor" strokeWidth="1.4" />
              </svg>
            }
            label={t("profile.notifications")}
            onClick={() => navigate("/notifications")}
          />
        )}
        <MenuRow
          icon={
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <circle cx="9" cy="9" r="7" stroke="currentColor" strokeWidth="1.4" />
              <path d="M9 10V10.5M6.5 7C6.5 5.619 7.619 5 9 5C10.381 5 11.5 5.619 11.5 7C11.5 8.381 9 9 9 10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
          }
          label={t("profile.help_support")}
          onClick={() => {}}
        />
      </div>

      {/* Sign out — only when authenticated */}
      {isAuthenticated && (
        <div className="bg-ds-bg-primary border border-ds-border mt-ds-3">
          <MenuRow
            icon={
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M7 3H3C2.448 3 2 3.448 2 4V14C2 14.552 2.448 15 3 15H7M12 12L16 9L12 6M16 9H7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            }
            label={t("profile.sign_out")}
            onClick={() => logout.mutate(undefined, { onSuccess: () => navigate("/") })}
          />
        </div>
      )}
    </div>
  );
}
