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
    <div className="fixed bottom-0 inset-x-0 z-50 p-3 sm:p-4 pointer-events-none">
      <div className="pointer-events-auto mx-auto max-w-[520px] animate-in slide-in-from-bottom-4 duration-500 fill-mode-both">
        <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-[0_-4px_32px_rgba(0,0,0,0.12)]">
          {/* Accent strip */}
          <div className="absolute top-0 inset-x-0 h-[3px] bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500" />

          <div className="px-5 pt-5 pb-4">
            {/* Header */}
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-900">
                <Cookie className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-[15px] font-semibold leading-[20px] tracking-[-0.01em] text-gray-900">
                  We value your privacy
                </h3>
                <p className="mt-1 text-[13px] leading-[18px] text-gray-500">
                  We use cookies to improve your experience, remember your preferences, and keep you signed in.
                  Read our <Link to="/privacy" className="underline text-gray-600">Privacy Policy</Link>.
                </p>
              </div>
              <button
                onClick={reject}
                className="shrink-0 -mt-1 -mr-1 p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                aria-label="Dismiss"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Expandable details */}
            {expanded && (
              <div className="mt-3 rounded-xl bg-gray-50 p-3.5 text-[12px] leading-[17px] text-gray-600 space-y-2.5 animate-in fade-in duration-200">
                <div className="flex items-start gap-2">
                  <Shield className="h-3.5 w-3.5 text-gray-400 mt-0.5 shrink-0" />
                  <div>
                    <span className="font-medium text-gray-700">Essential cookies</span> — required for authentication, session management, and security. Always active.
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Shield className="h-3.5 w-3.5 text-gray-400 mt-0.5 shrink-0" />
                  <div>
                    <span className="font-medium text-gray-700">Functional cookies</span> — remember your language, theme, and saved preferences across visits.
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Shield className="h-3.5 w-3.5 text-gray-400 mt-0.5 shrink-0" />
                  <div>
                    <span className="font-medium text-gray-700">Analytics cookies</span> — help us understand how you use the app so we can improve it. No personal data is shared with third parties.
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="mt-4 flex items-center gap-2">
              <button
                onClick={accept}
                className="flex-1 h-10 rounded-xl bg-gray-900 text-[13px] font-semibold text-white hover:bg-gray-800 active:scale-[0.98] transition-all"
              >
                Accept All
              </button>
              <button
                onClick={reject}
                className="flex-1 h-10 rounded-xl border border-gray-200 bg-white text-[13px] font-semibold text-gray-700 hover:bg-gray-50 active:scale-[0.98] transition-all"
              >
                Reject Non-Essential
              </button>
            </div>

            {/* Learn more toggle */}
            <button
              onClick={() => setExpanded((e) => !e)}
              className="mt-2.5 w-full text-center text-[12px] font-medium text-gray-400 hover:text-gray-600 transition-colors"
            >
              {expanded ? "Show less" : "Learn more about our cookies"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
