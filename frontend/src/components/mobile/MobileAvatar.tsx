type AvatarColor = "navy" | "teal" | "purple";
type AvatarSize = "sm" | "md" | "lg" | "xl";
type AvatarShape = "circle" | "rounded";

interface Props {
  name: string;
  color?: AvatarColor;
  size?: AvatarSize;
  shape?: AvatarShape;
  imageUrl?: string;
}

const COLOR_CLASSES: Record<AvatarColor, string> = {
  navy: "bg-ds-avatar-navy",
  teal: "bg-ds-avatar-teal",
  purple: "bg-ds-avatar-purple",
};

const SIZE_CLASSES: Record<AvatarSize, { container: string; text: string }> = {
  sm: { container: "w-8 h-8", text: "ds-caption-medium" },
  md: { container: "w-10 h-10", text: "ds-body-strong" },
  lg: { container: "w-12 h-12", text: "ds-h4" },
  xl: { container: "w-[72px] h-[72px]", text: "ds-h2" },
};

function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
}

function pickColor(name: string): AvatarColor {
  const colors: AvatarColor[] = ["navy", "teal", "purple"];
  return colors[name.charCodeAt(0) % colors.length];
}

export function MobileAvatar({ name, color, size = "md", shape = "circle", imageUrl }: Props) {
  const resolvedColor = color ?? pickColor(name);
  const { container, text } = SIZE_CLASSES[size];
  const radius = shape === "rounded" ? "rounded-ds-xl" : "rounded-ds-full";

  if (imageUrl) {
    return (
      <div className={`${container} ${radius} overflow-hidden flex-shrink-0`}>
        <img src={imageUrl} alt={name} className="w-full h-full object-cover" />
      </div>
    );
  }

  return (
    <div
      className={`${container} ${COLOR_CLASSES[resolvedColor]} ${radius} flex items-center justify-center flex-shrink-0`}
    >
      <span className={`${text} text-ds-text-inverse`}>{getInitials(name)}</span>
    </div>
  );
}
