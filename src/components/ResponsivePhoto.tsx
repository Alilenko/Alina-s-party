import Image from "next/image";

interface ResponsivePhotoProps {
  src: string;
  alt: string;
  thumbnail?: boolean;
  className?: string;
}

/** Зберігає оригінальні пропорції; thumbnail — обмежена ширина */
export default function ResponsivePhoto({
  src,
  alt,
  thumbnail = false,
  className = "",
}: ResponsivePhotoProps) {
  return (
    <Image
      src={src}
      alt={alt}
      width={0}
      height={0}
      sizes={thumbnail ? "96px" : "(max-width: 767px) 100vw, 767px"}
      className={`h-auto ${thumbnail ? "max-w-24" : "w-full"} ${className}`}
      style={{ width: thumbnail ? "auto" : "100%", height: "auto", maxWidth: thumbnail ? "6rem" : "100%" }}
    />
  );
}
