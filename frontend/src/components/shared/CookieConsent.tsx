import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Cookie, Shield, X } from "lucide-react";

const COOKIE_KEY = "probook_cookie_consent";

type ConsentState = "pending" | "accepted" | "rejected";

function getStoredConsent(): ConsentState {
  const val = localStorage.getItem(COOKIE_KEY);
  if (val === "accepted" || val === "rejected") return val;
  return "pending";
}

export function CookieConsent() {
  const [state, setState] = useState<ConsentState>(getStoredConsent);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (state === "pending") {
      const timer = setTimeout(() => setExpanded(false), 100);
      return () => clearTimeout(timer);
    }
  }, [state]);

  if (state !== "pending") return null;

  const accept = () => {
    localStorage.setItem(COOKIE_KEY, "accepted");
    setState("accepted");
  };

  const reject = () => {
    localStorage.setItem(COOKIE_KEY, "rejected");
    setState("rejected");
  };

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 p-3 sm:p-4 pointer-events-none" role="region" aria-label="Cookie consent">
      <div className="pointer-events-auto mx-auto max-w-[520px]">
        <div className="relative overflow-hidden rounded-ds-2xl border border-ds-border bg-ds-bg-primary shadow-lg">
          {/* Accent strip */}
          <div className="absolute top-0 inset-x-0 h-[3px] bg-ds-interactive" />

          <div className="px-5 pt-5 pb-4">
            {/* Header */}
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-ds-xl bg-ds-interactive">
                <Cookie className="h-5 w-5 text-ds-text-inverse" aria-hidden />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="ds-h4 text-ds-text-primary">
                  We value your privacy
                </h2>
                <p className="mt-1 ds-body-small text-ds-text-secondary">
                  We use cookies to improve your experience, remember your preferences, and keep you signed in.
                  Read our <Link to="/privacy" className="underline text-ds-text-primary">Privacy Policy</Link>.
                </p>
              </div>
              <button
                onClick={reject}
                className="shrink-0 -mt-1 -mr-1 p-1.5 rounded-ds-md text-ds-text-secondary hover:text-ds-text-primary hover:bg-ds-bg-tertiary transition-colors"
                aria-label="Dismiss"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </div>

            {/* Expandable details */}
            {expanded && (
              <div className="mt-3 rounded-ds-xl bg-ds-bg-secondary p-ds-3 ds-caption text-ds-text-muted space-y-2.5 animate-in fade-in duration-200">
                <div className="flex items-start gap-2">
                  <Shield className="h-3.5 w-3.5 text-ds-text-secondary mt-0.5 shrink-0" aria-hidden />
                  <div>
                    <span className="font-medium text-ds-text-primary">Essential cookies</span> — required for authentication, session management, and security. Always active.
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Shield className="h-3.5 w-3.5 text-ds-text-secondary mt-0.5 shrink-0" aria-hidden />
                  <div>
                    <span className="font-medium text-ds-text-primary">Functional cookies</span> — remember your language, theme, and saved preferences across visits.
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Shield className="h-3.5 w-3.5 text-ds-text-secondary mt-0.5 shrink-0" aria-hidden />
                  <div>
                    <span className="font-medium text-ds-text-primary">Analytics cookies</span> — help us understand how you use the app so we can improve it. No personal data is shared with third parties.
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="mt-4 flex items-center gap-2">
              <button
                onClick={accept}
                className="flex-1 h-10 rounded-ds-xl bg-ds-interactive ds-label text-ds-text-inverse hover:bg-ds-interactive-hover active:scale-[0.98] transition-all"
              >
                Accept All
              </button>
              <button
                onClick={reject}
                className="flex-1 h-10 rounded-ds-xl border border-ds-border bg-ds-bg-primary ds-label text-ds-text-primary hover:bg-ds-bg-tertiary active:scale-[0.98] transition-all"
              >
                Reject Non-Essential
              </button>
            </div>

            {/* Learn more toggle */}
            <button
              onClick={() => setExpanded((e) => !e)}
              aria-expanded={expanded}
              className="mt-2.5 w-full text-center ds-caption-medium text-ds-text-secondary hover:text-ds-text-primary transition-colors"
            >
              {expanded ? "Show less" : "Learn more about our cookies"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
