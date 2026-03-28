import { ReactNode } from "react";
import { useNavigate } from "react-router-dom";

type Variant = "brand" | "title-action" | "back-title" | "back-title-action";

interface Props {
  variant: Variant;
  title?: string;
  onBack?: () => void;
  rightElement?: ReactNode;
}

function BackButton({ onBack }: { onBack?: () => void }) {
  const navigate = useNavigate();
  const handleBack = onBack ?? (() => navigate(-1));
  return (
    <button
      onClick={handleBack}
      className="w-10 h-10 flex items-center justify-center rounded-ds-full text-ds-text-primary"
      aria-label="Go back"
    >
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}

export function AppHeader({ variant, title, onBack, rightElement }: Props) {
  return (
    <header className="h-[56px] bg-ds-bg-primary border-b border-ds-border flex items-center px-ds-4 gap-ds-2 sticky top-0 z-10">
      {variant === "brand" && (
        <>
          <span className="ds-h3 text-ds-text-primary flex-1">ProBook</span>
          {rightElement}
        </>
      )}

      {variant === "title-action" && (
        <>
          <span className="ds-h3 text-ds-text-primary flex-1">{title}</span>
          {rightElement}
        </>
      )}

      {variant === "back-title" && (
        <>
          <BackButton onBack={onBack} />
          <span className="ds-h3 text-ds-text-primary flex-1">{title}</span>
        </>
      )}

      {variant === "back-title-action" && (
        <>
          <BackButton onBack={onBack} />
          <span className="ds-h3 text-ds-text-primary flex-1">{title}</span>
          {rightElement}
        </>
      )}
    </header>
  );
}
