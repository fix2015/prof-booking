import { useNavigate } from "react-router-dom";
import { useAuthContext } from "@/context/AuthContext";
import { useLogout } from "@/hooks/useAuth";
import { AppHeader } from "@/components/mobile/AppHeader";
import { MobileAvatar } from "@/components/mobile/MobileAvatar";
import { t } from "@/i18n";

interface MenuItem {
  label: string;
  icon: JSX.Element;
  onClick: () => void;
  destructive?: boolean;
}

function ChevronRight() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-ds-text-disabled">
      <path d="M6 4L10 8L6 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function UserProfilePage() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthContext();
  const logout = useLogout();

  const displayName = isAuthenticated && user ? user.email.split("@")[0] : t("profile.guest");
  const displayEmail = user?.email ?? "";

  const SettingsButton = (
    <button className="w-8 h-8 flex items-center justify-center text-ds-text-primary">
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path
          d="M10 12a2 2 0 100-4 2 2 0 000 4z"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <path
          d="M16.5 10c0-.55-.05-1.09-.15-1.61l2.15-1.67-2-3.46-2.47.99a7.5 7.5 0 00-2.79-1.61L10.75 1h-4l-.49 2.64a7.5 7.5 0 00-2.79 1.61L1 4.26l-2 3.46 2.15 1.67C1.05 8.91 1 9.45 1 10c0 .55.05 1.09.15 1.61L-.85 13.28l2 3.46 2.47-.99a7.5 7.5 0 002.79 1.61L6.75 20h4l.49-2.64a7.5 7.5 0 002.79-1.61l2.47.99 2-3.46-2.15-1.67c.1-.52.15-1.06.15-1.61z"
          stroke="currentColor"
          strokeWidth="1.5"
        />
      </svg>
    </button>
  );

  const menuItems: MenuItem[] = [
    {
      label: t("profile.my_bookings"),
      icon: (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <rect x="2" y="3" width="14" height="13" rx="2" stroke="currentColor" strokeWidth="1.4" />
          <path d="M6 1V5M12 1V5M2 8H16" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      ),
      onClick: () => navigate("/sessions"),
    },
    {
      label: t("profile.payment_methods"),
      icon: (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <rect x="1" y="4" width="16" height="11" rx="2" stroke="currentColor" strokeWidth="1.4" />
          <path d="M1 8H17" stroke="currentColor" strokeWidth="1.4" />
        </svg>
      ),
      onClick: () => {},
    },
    {
      label: t("profile.notifications"),
      icon: (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path
            d="M9 2C6.239 2 4 4.239 4 7V11L2 13H16L14 11V7C14 4.239 11.761 2 9 2Z"
            stroke="currentColor"
            strokeWidth="1.4"
          />
          <path d="M7 13C7 14.105 7.895 15 9 15C10.105 15 11 14.105 11 13" stroke="currentColor" strokeWidth="1.4" />
        </svg>
      ),
      onClick: () => navigate("/notifications"),
    },
    {
      label: t("profile.help_support"),
      icon: (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <circle cx="9" cy="9" r="7" stroke="currentColor" strokeWidth="1.4" />
          <path d="M9 10V10.5M6.5 7C6.5 5.619 7.619 5 9 5C10.381 5 11.5 5.619 11.5 7C11.5 8.381 9 9 9 10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      ),
      onClick: () => {},
    },
    {
      label: t("profile.sign_out"),
      icon: (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path d="M7 3H3C2.448 3 2 3.448 2 4V14C2 14.552 2.448 15 3 15H7M12 12L16 9L12 6M16 9H7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
      onClick: () => logout.mutate(undefined, { onSuccess: () => navigate("/login") }),
      destructive: true,
    },
  ];

  return (
    <div className="flex flex-col min-h-full bg-ds-bg-secondary">
      <AppHeader variant="title-action" title={t("profile.page_title")} rightElement={SettingsButton} />

      {/* Avatar section */}
      <div className="bg-ds-bg-primary px-ds-4 pt-ds-6 pb-ds-6 flex flex-col items-center gap-ds-3 border-b border-ds-border">
        <MobileAvatar name={displayName} size="xl" color="teal" />
        <div className="text-center">
          <p className="ds-h3 text-ds-text-primary">{displayName}</p>
          {displayEmail && (
            <p className="ds-body text-ds-text-secondary mt-[2px]">{displayEmail}</p>
          )}
        </div>
        {isAuthenticated ? (
          <button
            onClick={() => navigate("/profile/professional")}
            className="ds-body-small text-ds-interactive border border-ds-interactive rounded-ds-full px-ds-4 h-[30px]"
          >
            {t("profile.edit")}
          </button>
        ) : (
          <button
            onClick={() => navigate("/login")}
            className="px-ds-6 h-[40px] bg-ds-interactive rounded-ds-xl ds-body-strong text-ds-text-inverse"
          >
            {t("profile.sign_in_cta")}
          </button>
        )}
      </div>

      {/* Menu items */}
      <div className="bg-ds-bg-primary mt-ds-3">
        {menuItems.map((item, idx) => (
          <button
            key={item.label}
            onClick={item.onClick}
            className={`w-full flex items-center gap-ds-3 px-ds-4 h-[52px] ${
              idx < menuItems.length - 1 ? "border-b border-ds-border" : ""
            } active:bg-ds-bg-secondary`}
          >
            <span className={item.destructive ? "text-ds-feedback-saved" : "text-ds-text-secondary"}>
              {item.icon}
            </span>
            <span className={`flex-1 ds-body text-left ${item.destructive ? "text-ds-feedback-saved" : "text-ds-text-primary"}`}>
              {item.label}
            </span>
            {!item.destructive && <ChevronRight />}
          </button>
        ))}
      </div>
    </div>
  );
}
