interface Props {
  rating: number;
  max?: number;
  size?: "sm" | "md";
}

export function StarRating({ rating, max = 5, size = "md" }: Props) {
  const px = size === "sm" ? 12 : 16;
  return (
    <div className="flex items-center gap-[2px]">
      {Array.from({ length: max }, (_, i) => {
        const filled = i < Math.round(rating);
        return (
          <svg key={i} width={px} height={px} viewBox="0 0 16 16" fill="none">
            <path
              d="M8 1L9.854 5.854H15L10.573 8.646L12.427 13.5L8 10.708L3.573 13.5L5.427 8.646L1 5.854H6.146L8 1Z"
              fill={filled ? "var(--ds-feedback-rating)" : "var(--ds-border-strong)"}
            />
          </svg>
        );
      })}
    </div>
  );
}
