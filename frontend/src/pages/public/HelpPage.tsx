import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppHeader } from "@/components/mobile/AppHeader";
import { t } from "@/i18n";

interface FaqItem {
  question: string;
  answer: string;
}

function FaqRow({ question, answer }: FaqItem) {
  const [open, setOpen] = useState(false);
  return (
    <button
      type="button"
      onClick={() => setOpen((o) => !o)}
      className="w-full text-left px-ds-4 py-ds-3 border-b border-ds-border last:border-b-0"
    >
      <div className="flex items-center justify-between gap-ds-2">
        <span className="ds-body-strong text-ds-text-primary">{question}</span>
        <svg
          width="16" height="16" viewBox="0 0 16 16" fill="none"
          className={`shrink-0 text-ds-text-muted transition-transform ${open ? "rotate-180" : ""}`}
        >
          <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      {open && (
        <p className="ds-body text-ds-text-secondary mt-ds-2">{answer}</p>
      )}
    </button>
  );
}

export function HelpPage() {
  const navigate = useNavigate();

  const faqs: FaqItem[] = [
    { question: t("help.faq_book_q"), answer: t("help.faq_book_a") },
    { question: t("help.faq_cancel_q"), answer: t("help.faq_cancel_a") },
    { question: t("help.faq_free_q"), answer: t("help.faq_free_a") },
    { question: t("help.faq_contact_q"), answer: t("help.faq_contact_a") },
  ];

  return (
    <div className="flex flex-col min-h-full bg-ds-bg-secondary">
      <AppHeader variant="back-title" title={t("help.page_title")} onBack={() => navigate(-1)} />

      {/* Intro card */}
      <div className="bg-ds-bg-primary border-b border-ds-border px-ds-4 py-ds-6 flex flex-col items-center gap-ds-2 text-center">
        <p className="text-[22px] font-semibold text-ds-text-primary leading-tight">ProBook</p>
        <p className="ds-body text-ds-text-secondary">{t("help.tagline")}</p>
      </div>

      {/* About section */}
      <div className="bg-ds-bg-primary border border-ds-border mt-ds-3 px-ds-4 py-ds-4">
        <p className="ds-label text-ds-text-secondary mb-ds-2">{t("help.about_title")}</p>
        <p className="ds-body text-ds-text-secondary">{t("help.about_text")}</p>
      </div>

      {/* FAQ */}
      <div className="bg-ds-bg-primary border border-ds-border mt-ds-3">
        <p className="ds-label text-ds-text-secondary px-ds-4 pt-ds-4 pb-ds-2">{t("help.faq_title")}</p>
        {faqs.map((f) => (
          <FaqRow key={f.question} question={f.question} answer={f.answer} />
        ))}
      </div>

      {/* Contact */}
      <div className="bg-ds-bg-primary border border-ds-border mt-ds-3 px-ds-4 py-ds-4 flex flex-col gap-ds-3">
        <p className="ds-label text-ds-text-secondary">{t("help.contact_title")}</p>
        <a
          href="mailto:support@probooking.app"
          className="flex items-center gap-ds-3 active:opacity-70"
        >
          <div className="size-[36px] rounded-full bg-ds-bg-secondary flex items-center justify-center shrink-0 text-ds-text-secondary">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <rect x="2" y="4" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.4" />
              <path d="M2 6l7 5 7-5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
          </div>
          <div className="flex flex-col">
            <span className="ds-body-strong text-ds-text-primary">{t("help.email_label")}</span>
            <span className="ds-caption text-ds-interactive">support@probooking.app</span>
          </div>
        </a>
        <a
          href="https://probooking.app"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-ds-3 active:opacity-70"
        >
          <div className="size-[36px] rounded-full bg-ds-bg-secondary flex items-center justify-center shrink-0 text-ds-text-secondary">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <circle cx="9" cy="9" r="7" stroke="currentColor" strokeWidth="1.4" />
              <path d="M2 9h14M9 2c-2 2-3 4.5-3 7s1 5 3 7M9 2c2 2 3 4.5 3 7s-1 5-3 7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
          </div>
          <div className="flex flex-col">
            <span className="ds-body-strong text-ds-text-primary">{t("help.website_label")}</span>
            <span className="ds-caption text-ds-interactive">probooking.app</span>
          </div>
        </a>
      </div>

      {/* Version */}
      <p className="ds-caption text-ds-text-muted text-center py-ds-6">ProBook v1.0 · probooking.app</p>
    </div>
  );
}
