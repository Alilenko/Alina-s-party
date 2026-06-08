"use client";

import Image from "next/image";
import { X } from "lucide-react";

interface PhotoLightboxProps {
  src: string;
  alt?: string;
  caption?: string;
  onClose: () => void;
}

export default function PhotoLightbox({ src, alt = "Фото", caption, onClose }: PhotoLightboxProps) {
  return (
    <div
      className="fixed inset-0 z-[60] flex flex-col bg-black/90 p-4"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="mb-4 flex h-10 w-10 shrink-0 items-center justify-center self-end rounded-full bg-white/10 text-white"
        aria-label="Закрити"
      >
        <X size={22} />
      </button>

      <div
        className="mx-auto flex flex-1 w-full max-w-lg items-center justify-center overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <Image
          src={src}
          alt={alt}
          width={0}
          height={0}
          sizes="(max-width: 767px) 100vw, 767px"
          className="h-auto max-h-[70dvh] w-auto max-w-full"
          style={{ width: "auto", height: "auto", maxWidth: "100%", maxHeight: "70dvh" }}
          priority
        />
      </div>

      {caption && (
        <p className="mt-4 text-center text-sm text-party-cream/80">{caption}</p>
      )}
    </div>
  );
}
