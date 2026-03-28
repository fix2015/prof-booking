import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useRegisterClient } from "@/hooks/useAuth";
import { useGuestSession } from "@/hooks/useGuestSession";
import { AppHeader } from "@/components/mobile/AppHeader";
import { t } from "@/i18n";

export function ClientRegisterPage() {
  const navigate = useNavigate();
  const registerClient = useRegisterClient();
  const { guestProfile, clearGuestSession } = useGuestSession();

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
  });

  useEffect(() => {
    if (guestProfile) {
      setForm((f) => ({
        ...f,
        name: guestProfile.name || f.name,
        email: guestProfile.email || f.email,
        phone: guestProfile.phone || f.phone,
      }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const canSubmit = form.name.trim() && form.email.trim() && form.phone.trim() && form.password.trim().length >= 6;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    registerClient.mutate(
      { email: form.email, phone: form.phone, password: form.password, name: form.name },
      {
        onSuccess: () => {
          clearGuestSession();
          navigate("/me");
        },
      }
    );
  }

  const fields: Array<{ key: keyof typeof form; label: string; type: string; placeholder: string }> = [
    { key: "name", label: "Full name", type: "text", placeholder: "Jane Smith" },
    { key: "email", label: "Email", type: "email", placeholder: "jane@example.com" },
    { key: "phone", label: "Phone", type: "tel", placeholder: "+1 (555) 000-0000" },
    { key: "password", label: "Password", type: "password", placeholder: "At least 6 characters" },
  ];

  return (
    <div className="max-w-[768px] mx-auto min-h-screen flex flex-col bg-ds-bg-secondary">
      <AppHeader variant="back-title" title="Create account" onBack={() => navigate(-1)} />

      <form onSubmit={handleSubmit} className="flex-1 px-ds-4 py-ds-6 flex flex-col gap-ds-4">
        <p className="ds-body text-ds-text-secondary">
          Your bookings and preferences will be saved to your account.
        </p>

        <div className="flex flex-col gap-ds-3">
          {fields.map(({ key, label, type, placeholder }) => (
            <div key={key}>
              <label className="ds-label text-ds-text-secondary block mb-ds-1">{label}</label>
              <input
                type={type}
                placeholder={placeholder}
                value={form[key]}
                onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                className="w-full h-[44px] px-ds-3 bg-ds-bg-primary border border-ds-border rounded-ds-xl ds-body text-ds-text-primary placeholder:text-ds-text-disabled outline-none focus:border-ds-interactive"
              />
            </div>
          ))}
        </div>

        {registerClient.isError && (
          <p className="ds-caption text-ds-feedback-saved text-center">
            {t("common.error")}
          </p>
        )}
      </form>

      <div className="px-ds-4 py-ds-4 bg-ds-bg-primary border-t border-ds-border">
        <button
          type="submit"
          form="client-register-form"
          disabled={!canSubmit || registerClient.isPending}
          onClick={handleSubmit}
          className={`w-full h-[48px] rounded-ds-2xl ds-body-large transition-colors ${
            canSubmit && !registerClient.isPending
              ? "bg-ds-interactive text-ds-text-inverse"
              : "bg-ds-bg-secondary text-ds-text-disabled"
          }`}
        >
          {registerClient.isPending ? "Creating account…" : "Create account"}
        </button>
        <button
          onClick={() => navigate("/login")}
          className="w-full mt-ds-3 ds-body-small text-ds-interactive text-center"
        >
          Already have an account? Sign in
        </button>
      </div>
    </div>
  );
}
