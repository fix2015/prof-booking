import { useState, useEffect } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useLogin, useRegisterClient } from "@/hooks/useAuth";
import { useAuthContext } from "@/context/AuthContext";
import { useGuestSession } from "@/hooks/useGuestSession";
import { AppHeader } from "@/components/mobile/AppHeader";
import { t } from "@/i18n";

type Tab = "signin" | "register";

export function LoginPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthContext();
  const { guestProfile, clearGuestSession } = useGuestSession();

  const login = useLogin();
  const registerClient = useRegisterClient();

  const [tab, setTab] = useState<Tab>("signin");

  const [signInForm, setSignInForm] = useState({ email: "", password: "" });
  const [registerForm, setRegisterForm] = useState({ name: "", email: "", phone: "", password: "" });

  // Prefill register form from guest session
  useEffect(() => {
    if (guestProfile) {
      setRegisterForm((f) => ({
        ...f,
        name: guestProfile.name || f.name,
        email: guestProfile.email || f.email,
        phone: guestProfile.phone || f.phone,
      }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  const canSignIn = signInForm.email.trim() && signInForm.password.trim();
  const canRegister =
    registerForm.name.trim() &&
    registerForm.email.trim() &&
    registerForm.phone.trim() &&
    registerForm.password.trim().length >= 6;

  function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    if (!canSignIn) return;
    login.mutate({ email: signInForm.email, password: signInForm.password });
  }

  function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (!canRegister) return;
    registerClient.mutate(
      {
        email: registerForm.email,
        phone: registerForm.phone,
        password: registerForm.password,
        name: registerForm.name,
      },
      {
        onSuccess: () => {
          clearGuestSession();
          navigate("/me");
        },
      }
    );
  }

  const inputCls =
    "w-full h-[44px] px-ds-3 bg-ds-bg-primary border border-ds-border rounded-ds-xl ds-body text-ds-text-primary placeholder:text-ds-text-disabled outline-none focus:border-ds-interactive";
  const labelCls = "ds-label text-ds-text-secondary block mb-ds-1";

  return (
    <div className="max-w-[768px] mx-auto min-h-screen flex flex-col bg-ds-bg-secondary">
      <AppHeader variant="back-title" title="" onBack={() => navigate(-1)} />

      {/* Brand area */}
      <div className="bg-ds-bg-primary border-b border-ds-border flex flex-col items-center gap-[8px] pt-7 pb-6">
        <div className="size-[56px] rounded-[10px] bg-ds-avatar-navy flex items-center justify-center">
          <span className="text-[20px] font-bold text-ds-text-inverse leading-none">PB</span>
        </div>
        <p className="text-[20px] font-semibold text-ds-text-primary leading-tight">ProBook</p>
        <p className="ds-body text-ds-text-secondary">
          {tab === "signin" ? t("login.sign_in") : t("login.tab_create")}
        </p>
      </div>

      {/* Segment tabs */}
      <div className="bg-ds-bg-primary border-b border-ds-border flex">
        {(["signin", "register"] as Tab[]).map((value) => {
          const label = value === "signin" ? t("login.tab_signin") : t("login.tab_create");
          const isActive = tab === value;
          return (
            <button
              key={value}
              onClick={() => setTab(value)}
              className={`flex-1 h-[44px] ds-body-strong transition-colors relative ${
                isActive ? "text-ds-text-primary" : "text-ds-text-secondary"
              }`}
            >
              {label}
              {isActive && (
                <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-ds-interactive rounded-t-ds-full" />
              )}
            </button>
          );
        })}
      </div>

      {/* Forms */}
      <div className="flex-1 flex flex-col">
        {tab === "signin" ? (
          <form onSubmit={handleSignIn} className="flex-1 flex flex-col">
            <div className="bg-ds-bg-primary flex flex-col gap-ds-4 px-ds-4 pt-ds-5 pb-ds-4">
              {login.isError && (
                <p className="ds-caption text-ds-feedback-saved text-center">{t("login.invalid_credentials")}</p>
              )}
              <div>
                <label className={labelCls}>{t("login.email")}</label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={signInForm.email}
                  onChange={(e) => setSignInForm((f) => ({ ...f, email: e.target.value }))}
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>{t("login.password")}</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={signInForm.password}
                  onChange={(e) => setSignInForm((f) => ({ ...f, password: e.target.value }))}
                  className={inputCls}
                />
              </div>
              <button
                type="submit"
                disabled={!canSignIn || login.isPending}
                className={`w-full h-[48px] rounded-ds-2xl ds-body-strong transition-colors ${
                  canSignIn && !login.isPending
                    ? "bg-ds-interactive text-ds-text-inverse"
                    : "bg-ds-bg-secondary text-ds-text-disabled"
                }`}
              >
                {login.isPending ? "Signing in…" : t("login.tab_signin")}
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="flex-1 flex flex-col">
            <div className="bg-ds-bg-primary flex flex-col gap-ds-4 px-ds-4 pt-ds-5 pb-ds-4">
              {registerClient.isError && (
                <p className="ds-caption text-ds-feedback-saved text-center">{t("common.error")}</p>
              )}
              {(
                [
                  { key: "name" as const, label: t("login.full_name"), type: "text", placeholder: "Jane Smith" },
                  { key: "email" as const, label: t("login.email"), type: "email", placeholder: "you@example.com" },
                  { key: "phone" as const, label: t("login.phone"), type: "tel", placeholder: "+1 (555) 000-0000" },
                  { key: "password" as const, label: t("login.password"), type: "password", placeholder: t("login.password_hint") },
                ]
              ).map(({ key, label, type, placeholder }) => (
                <div key={key}>
                  <label className={labelCls}>{label}</label>
                  <input
                    type={type}
                    placeholder={placeholder}
                    value={registerForm[key]}
                    onChange={(e) => setRegisterForm((f) => ({ ...f, [key]: e.target.value }))}
                    className={inputCls}
                  />
                </div>
              ))}
              <button
                type="submit"
                disabled={!canRegister || registerClient.isPending}
                className={`w-full h-[48px] rounded-ds-2xl ds-body-strong transition-colors ${
                  canRegister && !registerClient.isPending
                    ? "bg-ds-interactive text-ds-text-inverse"
                    : "bg-ds-bg-secondary text-ds-text-disabled"
                }`}
              >
                {registerClient.isPending ? "Creating account…" : t("login.create_account_cta")}
              </button>
            </div>
          </form>
        )}

        {/* Footer links */}
        <div className="flex flex-col items-center gap-ds-3 px-ds-4 py-ds-6">
          <button
            onClick={() => navigate("/")}
            className="ds-body-small text-ds-interactive"
          >
            {t("login.guest_link")}
          </button>
          <div className="flex items-center gap-[6px]">
            <span className="ds-caption text-ds-text-muted">{t("login.for_business")}</span>
            <button
              onClick={() => navigate("/register")}
              className="ds-caption text-ds-interactive"
            >
              {t("login.register_business")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
