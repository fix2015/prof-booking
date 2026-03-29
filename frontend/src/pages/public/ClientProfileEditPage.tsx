import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { useAuthContext } from "@/context/AuthContext";
import { usersApi } from "@/api/users";
import { uploadsApi } from "@/api/uploads";
import { AppHeader } from "@/components/mobile/AppHeader";
import { t } from "@/i18n";

export function ClientProfileEditPage() {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuthContext();
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    name: user?.name ?? "",
    email: user?.email ?? "",
    phone: user?.phone ?? "",
  });
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url ?? "");
  const [uploadPending, setUploadPending] = useState(false);
  const [saved, setSaved] = useState(false);

  const update = useMutation({
    mutationFn: () =>
      usersApi.updateMe({
        name: form.name.trim() || undefined,
        email: form.email.trim() || undefined,
        phone: form.phone.trim() || undefined,
        avatar_url: avatarUrl || undefined,
      }),
    onSuccess: async () => {
      await refreshUser();
      setSaved(true);
      setTimeout(() => navigate(-1), 800);
    },
  });

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadPending(true);
    try {
      const url = await uploadsApi.uploadImage(file, 400);
      setAvatarUrl(url);
    } finally {
      setUploadPending(false);
    }
  }

  const initials = (form.name || form.email.split("@")[0])
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() || "?";

  const inputCls =
    "w-full h-[48px] px-ds-3 bg-ds-bg-primary border border-ds-border rounded-ds-lg ds-body text-ds-text-primary placeholder:text-ds-text-disabled outline-none focus:border-ds-interactive";
  const labelCls = "block mb-ds-1 text-[13px] font-semibold leading-[18px] text-ds-text-secondary";

  const canSave =
    (form.name.trim() || form.email.trim()) &&
    !update.isPending &&
    !uploadPending;

  return (
    <div className="max-w-[768px] mx-auto min-h-screen flex flex-col bg-ds-bg-secondary">
      <AppHeader variant="back-title" title={t("profile.edit")} onBack={() => navigate(-1)} />

      {/* Avatar picker */}
      <div className="bg-ds-bg-primary border-b border-ds-border flex flex-col items-center gap-ds-3 pt-ds-6 pb-ds-5">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="relative"
          aria-label="Change avatar"
        >
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt="avatar"
              className="size-[72px] rounded-[10px] object-cover"
            />
          ) : (
            <div className="size-[72px] rounded-[10px] bg-ds-avatar-navy flex items-center justify-center">
              <span className="text-[28px] font-semibold text-ds-text-inverse leading-none">{initials}</span>
            </div>
          )}
          {uploadPending ? (
            <div className="absolute inset-0 rounded-[10px] bg-black/40 flex items-center justify-center">
              <span className="text-white ds-caption">…</span>
            </div>
          ) : (
            <div className="absolute -bottom-[6px] -right-[6px] size-[22px] rounded-full bg-ds-interactive flex items-center justify-center shadow-sm">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M1 11h10M6 1v8M6 1l-3 3M6 1l3 3" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          )}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleAvatarChange}
        />
        <p className="ds-caption text-ds-text-secondary">{t("profile.tap_to_change_photo")}</p>
      </div>

      {/* Form */}
      <form
        onSubmit={(e) => { e.preventDefault(); if (canSave) update.mutate(); }}
        className="bg-ds-bg-primary border border-ds-border mt-ds-3 px-ds-4 pt-ds-5 pb-ds-4 flex flex-col gap-ds-4"
      >
        {update.isError && (
          <p className="ds-caption text-ds-feedback-saved text-center">{t("common.error")}</p>
        )}
        <div>
          <label className={labelCls}>{t("login.full_name")}</label>
          <input
            type="text"
            placeholder="Jane Smith"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>{t("login.phone")}</label>
          <input
            type="tel"
            placeholder="+1 (555) 000-0000"
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>{t("login.email")}</label>
          <input
            type="email"
            placeholder="you@example.com"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            className={inputCls}
          />
        </div>

        <button
          type="submit"
          disabled={!canSave}
          className={`w-full h-[48px] rounded-ds-lg ds-body-strong transition-colors ${
            canSave ? "bg-ds-interactive text-ds-text-inverse" : "bg-ds-bg-secondary text-ds-text-disabled"
          }`}
        >
          {saved ? "✓" : update.isPending ? "…" : t("profile.save")}
        </button>
      </form>
    </div>
  );
}
