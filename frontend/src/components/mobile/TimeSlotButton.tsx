interface Props {
  time: string;
  professionalName?: string;
  selected?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}

export function TimeSlotButton({ time, professionalName, selected = false, disabled = false, onClick }: Props) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        w-full h-[56px] rounded-ds-xl border flex flex-col items-center justify-center gap-[2px] transition-colors
        ${disabled
          ? "border-ds-border bg-ds-bg-secondary text-ds-text-disabled cursor-not-allowed"
          : selected
          ? "border-ds-interactive bg-ds-interactive text-ds-text-inverse"
          : "border-ds-border bg-ds-bg-primary text-ds-text-primary active:bg-ds-bg-secondary"
        }
      `}
    >
      <span className="ds-body-strong">{time}</span>
      {professionalName && (
        <span className={`ds-caption ${selected ? "text-ds-text-inverse" : "text-ds-text-secondary"}`}>
          {professionalName}
        </span>
      )}
    </button>
  );
}
