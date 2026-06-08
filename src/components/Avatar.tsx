import Image from "next/image";
import { User } from "lucide-react";

interface AvatarProps {
  src?: string | null;
  name: string;
  size?: "sm" | "md" | "lg" | "xl";
  shape?: "circle" | "square";
  className?: string;
}

const sizes = {
  sm: { px: 32, text: "text-xs" },
  md: { px: 48, text: "text-sm" },
  lg: { px: 80, text: "text-lg" },
  xl: { px: 120, text: "text-xl" },
};

function isValidImageSrc(src: string): boolean {
  const trimmed = src.trim();
  if (!trimmed) return false;
  if (trimmed.startsWith("/")) return true;
  try {
    const url = new URL(trimmed);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export default function Avatar({
  src,
  name,
  size = "md",
  shape = "circle",
  className = "",
}: AvatarProps) {
  const s = sizes[size];
  const rounded = shape === "square" ? "rounded-lg" : "rounded-full";
  const imageSrc = src && isValidImageSrc(src) ? src.trim() : null;

  if (imageSrc) {
    return (
      <div
        className={`relative overflow-hidden border-2 border-party-gold/50 ${rounded} ${className}`}
        style={{ width: s.px, height: s.px }}
      >
        <Image
          src={imageSrc}
          alt={name}
          fill
          className="object-cover"
          sizes={`${s.px}px`}
        />
      </div>
    );
  }

  return (
    <div
      className={`flex items-center justify-center border-2 border-party-gold/50 bg-party-gold/10 ${rounded} ${className}`}
      style={{ width: s.px, height: s.px }}
    >
      <span className={`font-medium text-party-gold ${s.text}`}>
        {name.charAt(0)}
      </span>
    </div>
  );
}
