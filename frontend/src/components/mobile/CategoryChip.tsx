interface Props {
  label: string;
  active?: boolean;
  onClick?: () => void;
}

export function CategoryChip({ label, active = false, onClick }: Props) {
  return (
    <button
      onClick={onClick}
      className={`
        flex-shrink-0 px-ds-3 h-[32px] rounded-ds-full border ds-label-small transition-colors
        ${active
          ? "bg-ds-interactive border-ds-interactive text-ds-text-inverse"
          : "bg-ds-bg-primary border-ds-border text-ds-text-secondary"
        }
      `}
    >
      {label}
    </button>
  );
}
