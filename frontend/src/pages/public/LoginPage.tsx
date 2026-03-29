import { useState, useEffect, useRef } from "react";
import { useNavigate, Navigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { X } from "lucide-react";
import { useLogin, useRegisterClient, useRegisterOwner, useRegisterProfessional } from "@/hooks/useAuth";
import { useAuthContext } from "@/context/AuthContext";
import { useGuestSession } from "@/hooks/useGuestSession";
import { providersApi } from "@/api/salons";
import { AppHeader } from "@/components/mobile/AppHeader";
import { t } from "@/i18n";

type Tab = "signin" | "client" | "business" | "pro";

const TABS: { value: Tab; label: string }[] = [
  { value: "signin", label: "Sign in" },
  { value: "client", label: "Client" },
  { value: "business", label: "Business" },
  { value: "pro", label: "Pro" },
];

const SUBTITLE: Record<Tab, string> = {
  signin: "Sign in to your account",
  client: "Create your account",
  business: "Create your business account",
  pro: "Join as a professional",
};

const HEADER_TITLE: Record<Tab, string> = {
  signin: "Sign in",
  client: "Create account",
  business: "Register business",
  pro: "Join as professional",
};

export function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated, role: currentRole } = useAuthContext();
  const { guestProfile, clearGuestSession } = useGuestSession();

  const login = useLogin();
  const registerClient = useRegisterClient();
  const registerOwner = useRegisterOwner();
  const registerPro = useRegisterProfessional();

  const initialTab = (searchParams.get("tab") as Tab | null) ?? "signin";
  const inviteToken = searchParams.get("invite") ?? undefined;

  const [tab, setTab] = useState<Tab>(TABS.some((t) => t.value === initialTab) ? initialTab : "signin");

  const [signInForm, setSignInForm] = useState({ identifier: "", password: "" });
  const [clientForm, setClientForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [bizForm, setBizForm] = useState({ email: "", phone: "", password: "", provider_name: "", provider_address: "", worker_payment_amount: "" });
  const [proForm, setProForm] = useState({ name: "", email: "", phone: "", instagram: "", password: "" });

  // Provider search for pro tab
  const [selectedProviderIds, setSelectedProviderIds] = useState<number[]>([]);
  const [providerSearch, setProviderSearch] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const comboRef = useRef<HTMLDivElement>(null);

  const { data: providers = [] } = useQuery({
    queryKey: ["providers", "public"],
    queryFn: () => providersApi.listPublic(),
    enabled: tab === "pro",
  });

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (comboRef.current && !comboRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Prefill client form from guest session
  useEffect(() => {
    if (guestProfile) {
      setClientForm((f) => ({
        ...f,
        name: guestProfile.name || f.name,
        email: guestProfile.email || f.email,
        phone: guestProfile.phone || f.phone,
      }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (isAuthenticated) return <Navigate to={currentRole === "client" ? "/me" : "/dashboard"} replace />;

  const inputCls =
    "w-full h-[48px] px-ds-3 bg-ds-bg-primary border border-ds-border rounded-ds-lg ds-body text-ds-text-primary placeholder:text-ds-text-disabled outline-none focus:border-ds-interactive";
  const labelCls = "block mb-ds-1 text-[13px] font-semibold leading-[18px] text-ds-text-secondary";

  const canSignIn = signInForm.identifier.trim() && signInForm.password.trim();
  const canClient = clientForm.name.trim() && clientForm.email.trim() && clientForm.phone.trim() && clientForm.password.length >= 6;
  const canBiz = bizForm.email.trim() && bizForm.phone.trim() && bizForm.password.length >= 8 && bizForm.provider_name.trim() && bizForm.provider_address.trim();
  const canPro = proForm.name.trim() && proForm.email.trim() && proForm.phone.trim() && proForm.password.length >= 8;

  function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    if (!canSignIn) return;
    const identifier = signInForm.identifier.trim();
    const isEmail = identifier.includes("@");
    login.mutate(
      {
        email: isEmail ? identifier : undefined,
        phone: isEmail ? undefined : identifier,
        password: signInForm.password,
      },
      {
        onSuccess: (tokens) => {
          navigate(tokens.role === "client" ? "/me" : "/dashboard", { replace: true });
        },
      }
    );
  }

  function handleClient(e: React.FormEvent) {
    e.preventDefault();
    if (!canClient) return;
    registerClient.mutate(
      { email: clientForm.email, phone: clientForm.phone, password: clientForm.password, name: clientForm.name },
      { onSuccess: () => { clearGuestSession(); navigate("/me"); } }
    );
  }

  function handleBiz(e: React.FormEvent) {
    e.preventDefault();
    if (!canBiz) return;
    registerOwner.mutate(
      {
        email: bizForm.email,
        phone: bizForm.phone,
        password: bizForm.password,
        provider_name: bizForm.provider_name,
        provider_address: bizForm.provider_address,
        worker_payment_amount: Number(bizForm.worker_payment_amount) || 0,
      },
      { onSuccess: () => navigate("/dashboard") }
    );
  }

  function handlePro(e: React.FormEvent) {
    e.preventDefault();
    if (!canPro) return;
    registerPro.mutate(
      {
        email: proForm.email,
        name: proForm.name,
        phone: proForm.phone,
        password: proForm.password,
        social_links: proForm.instagram ? { instagram: proForm.instagram } : undefined,
        invite_token: inviteToken,
        provider_ids: inviteToken ? undefined : (selectedProviderIds.length > 0 ? selectedProviderIds : undefined),
      },
      { onSuccess: () => navigate("/dashboard") }
    );
  }

  const addProvider = (id: number) => {
    if (!selectedProviderIds.includes(id)) setSelectedProviderIds((prev) => [...prev, id]);
    setProviderSearch("");
    setDropdownOpen(false);
  };
  const removeProvider = (id: number) => setSelectedProviderIds((prev) => prev.filter((s) => s !== id));
  const filteredProviders = providers.filter(
    (s) =>
      !selectedProviderIds.includes(s.id) &&
      (!providerSearch.trim() ||
        s.name.toLowerCase().includes(providerSearch.toLowerCase()) ||
        (s.address ?? "").toLowerCase().includes(providerSearch.toLowerCase()))
  );

  return (
    <div className="max-w-[768px] mx-auto min-h-screen flex flex-col bg-ds-bg-secondary">
      <AppHeader variant="back-title" title={HEADER_TITLE[tab]} onBack={() => navigate(-1)} />

      {/* Brand area */}
      <div className="bg-ds-bg-primary border-b border-ds-border flex flex-col items-center gap-[8px] pt-7 pb-6">
        <p className="text-[20px] font-semibold text-ds-text-primary leading-tight">ProBook</p>
        <p className="ds-body text-ds-text-secondary">{SUBTITLE[tab]}</p>
      </div>

      {/* 4-tab bar */}
      <div className="bg-ds-bg-primary border-b border-ds-border flex">
        {TABS.map(({ value, label }) => {
          const isActive = tab === value;
          return (
            <button
              key={value}
              onClick={() => setTab(value)}
              className={`flex-1 h-[44px] ds-body-small transition-colors relative ${
                isActive ? "font-semibold text-ds-text-primary" : "text-ds-text-secondary"
              }`}
            >
              {label}
              {isActive && (
                <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-ds-interactive" />
              )}
            </button>
          );
        })}
      </div>

      {/* Forms */}
      <div className="flex-1 flex flex-col">
        {/* Sign in */}
        {tab === "signin" && (
          <form onSubmit={handleSignIn}>
            <div className="bg-ds-bg-primary flex flex-col gap-ds-4 px-ds-4 pt-ds-5 pb-ds-4">
              {login.isError && (
                <p className="ds-caption text-ds-feedback-saved text-center">{t("login.invalid_credentials")}</p>
              )}
              <div>
                <label className={labelCls}>{t("login.email_or_phone")}</label>
                <input type="text" placeholder="you@example.com or +1 555 000" value={signInForm.identifier}
                  onChange={(e) => setSignInForm((f) => ({ ...f, identifier: e.target.value }))} className={inputCls} autoComplete="username" />
              </div>
              <div>
                <label className={labelCls}>{t("login.password")}</label>
                <input type="password" placeholder="••••••••" value={signInForm.password}
                  onChange={(e) => setSignInForm((f) => ({ ...f, password: e.target.value }))} className={inputCls} />
              </div>
              <CtaButton disabled={!canSignIn || login.isPending} pending={login.isPending} label={t("login.tab_signin")} />
            </div>
          </form>
        )}

        {/* Client register */}
        {tab === "client" && (
          <form onSubmit={handleClient}>
            <div className="bg-ds-bg-primary flex flex-col gap-ds-4 px-ds-4 pt-ds-5 pb-ds-4">
              {registerClient.isError && <p className="ds-caption text-ds-feedback-saved text-center">{t("common.error")}</p>}
              {([
                { key: "phone" as const, label: `${t("login.phone")} *`, type: "tel", ph: "+1 (555) 000-0000" },
                { key: "name" as const, label: `${t("login.full_name")} *`, type: "text", ph: "Jane Smith" },
                { key: "email" as const, label: `${t("login.email")} *`, type: "email", ph: "you@example.com" },
                { key: "password" as const, label: `${t("login.password")} *`, type: "password", ph: t("login.password_hint") },
              ]).map(({ key, label, type, ph }) => (
                <div key={key}>
                  <label className={labelCls}>{label}</label>
                  <input type={type} placeholder={ph} value={clientForm[key]}
                    onChange={(e) => setClientForm((f) => ({ ...f, [key]: e.target.value }))} className={inputCls} />
                </div>
              ))}
              <CtaButton disabled={!canClient || registerClient.isPending} pending={registerClient.isPending} label={t("login.create_account_cta")} />
            </div>
          </form>
        )}

        {/* Business register */}
        {tab === "business" && (
          <form onSubmit={handleBiz}>
            <div className="bg-ds-bg-primary flex flex-col gap-ds-4 px-ds-4 pt-ds-5 pb-ds-4">
              {registerOwner.isError && <p className="ds-caption text-ds-feedback-saved text-center">{t("common.error")}</p>}
              {([
                { key: "phone" as const, label: `${t("login.phone")} *`, type: "tel", ph: "+1 (555) 000-0000" },
                { key: "email" as const, label: `${t("login.email")} *`, type: "email", ph: "owner@business.com" },
                { key: "password" as const, label: `${t("login.password")} *`, type: "password", ph: "At least 8 characters" },
                { key: "provider_name" as const, label: `${t("register.business_name")} *`, type: "text", ph: "My Salon" },
                { key: "provider_address" as const, label: `${t("register.business_address")} *`, type: "text", ph: "123 Main Street, City" },
                { key: "worker_payment_amount" as const, label: t("register.worker_payment"), type: "number", ph: "0" },
              ]).map(({ key, label, type, ph }) => (
                <div key={key}>
                  <label className={labelCls}>{label}</label>
                  <input type={type} placeholder={ph} value={bizForm[key]}
                    onChange={(e) => setBizForm((f) => ({ ...f, [key]: e.target.value }))} className={inputCls} />
                </div>
              ))}
              <CtaButton disabled={!canBiz || registerOwner.isPending} pending={registerOwner.isPending} label={t("register.submit")} />
            </div>
          </form>
        )}

        {/* Professional register */}
        {tab === "pro" && (
          <form onSubmit={handlePro}>
            <div className="bg-ds-bg-primary flex flex-col gap-ds-4 px-ds-4 pt-ds-5 pb-ds-4">
              {registerPro.isError && <p className="ds-caption text-ds-feedback-saved text-center">{t("common.error")}</p>}
              {inviteToken && (
                <p className="ds-caption text-ds-text-secondary bg-ds-bg-secondary rounded-ds-lg px-ds-3 py-ds-2">
                  {t("register.pro.invite_notice")}
                </p>
              )}
              {([
                { key: "phone" as const, label: `${t("login.phone")} *`, type: "tel", ph: "+1 (555) 000-0000" },
                { key: "name" as const, label: `${t("login.full_name")} *`, type: "text", ph: "Jane Smith" },
                { key: "email" as const, label: `${t("login.email")} *`, type: "email", ph: "jane@example.com" },
                { key: "instagram" as const, label: t("register.pro.instagram"), type: "text", ph: "@yourusername" },
                { key: "password" as const, label: `${t("login.password")} *`, type: "password", ph: "At least 8 characters" },
              ]).map(({ key, label, type, ph }) => (
                <div key={key}>
                  <label className={labelCls}>{label}</label>
                  <input type={type} placeholder={ph} value={proForm[key]}
                    onChange={(e) => setProForm((f) => ({ ...f, [key]: e.target.value }))} className={inputCls} />
                </div>
              ))}

              {/* Apply to providers — hidden when coming from an invite link */}
              {!inviteToken && (
              <div>
                <label className={labelCls}>{t("register.pro.apply_providers")}</label>
                {selectedProviderIds.length > 0 && (
                  <div className="flex flex-wrap gap-[6px] mb-ds-2">
                    {selectedProviderIds.map((id) => {
                      const p = providers.find((s) => s.id === id);
                      return p ? (
                        <span key={id} className="flex items-center gap-[4px] bg-ds-bg-secondary text-ds-text-primary ds-caption px-[8px] py-[4px] rounded-ds-full">
                          {p.name}
                          <button type="button" onClick={() => removeProvider(id)} className="text-ds-text-secondary hover:text-ds-text-primary">
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ) : null;
                    })}
                  </div>
                )}
                <div className="relative" ref={comboRef}>
                  <input
                    type="text"
                    placeholder={t("register.pro.search_provider")}
                    value={providerSearch}
                    onChange={(e) => { setProviderSearch(e.target.value); setDropdownOpen(true); }}
                    onFocus={() => setDropdownOpen(true)}
                    className={inputCls}
                  />
                  {dropdownOpen && filteredProviders.length > 0 && (
                    <div className="absolute z-50 mt-[4px] w-full rounded-ds-lg border border-ds-border bg-ds-bg-primary shadow-lg max-h-48 overflow-y-auto">
                      {filteredProviders.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          className="w-full text-left px-ds-3 py-ds-2 hover:bg-ds-bg-secondary ds-body flex flex-col"
                          onMouseDown={(e) => { e.preventDefault(); addProvider(p.id); }}
                        >
                          <span className="text-ds-text-primary font-medium">{p.name}</span>
                          {p.address && <span className="ds-caption text-ds-text-secondary truncate">{p.address}</span>}
                        </button>
                      ))}
                    </div>
                  )}
                  {dropdownOpen && filteredProviders.length === 0 && providerSearch.trim() && (
                    <div className="absolute z-50 mt-[4px] w-full rounded-ds-lg border border-ds-border bg-ds-bg-primary shadow-lg px-ds-3 py-ds-2 ds-body text-ds-text-secondary">
                      {t("register.pro.no_providers")}
                    </div>
                  )}
                </div>
                <p className="ds-caption text-ds-text-secondary mt-[4px]">{t("register.pro.apply_hint")}</p>
              </div>
              )}

              <CtaButton disabled={!canPro || registerPro.isPending} pending={registerPro.isPending} label={t("register.pro.submit")} />
            </div>
          </form>
        )}

        {/* Footer */}
        <div className="flex flex-col items-center gap-ds-2 px-ds-4 py-ds-6">
          {tab === "signin" ? (
            <button onClick={() => navigate("/")} className="ds-body-small text-ds-interactive">
              {t("login.guest_link")}
            </button>
          ) : (
            <button onClick={() => setTab("signin")} className="ds-body-small text-ds-interactive">
              {t("login.already_account")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function CtaButton({ disabled, pending, label }: Readonly<{ disabled: boolean; pending: boolean; label: string }>) {
  const activeCls = "bg-ds-interactive text-ds-text-inverse";
  const inactiveCls = "bg-ds-bg-secondary text-ds-text-disabled";
  return (
    <button
      type="submit"
      disabled={disabled}
      className={`w-full h-[48px] rounded-ds-lg ds-body-strong transition-colors ${disabled ? inactiveCls : activeCls}`}
    >
      {pending ? "…" : label}
    </button>
  );
}
