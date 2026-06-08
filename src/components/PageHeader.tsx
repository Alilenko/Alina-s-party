"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, Info } from "lucide-react";

interface PageHeaderProps {
  title: string;
  showBack?: boolean;
  showInfo?: boolean;
  onInfoClick?: () => void;
}

export default function PageHeader({
  title,
  showBack = true,
  showInfo = false,
  onInfoClick,
}: PageHeaderProps) {
  const router = useRouter();

  return (
    <header className="flex items-center justify-between px-4 py-4">
      {showBack ? (
        <button
          onClick={() => router.back()}
          className="flex h-10 w-10 items-center justify-center rounded-full text-party-gold transition-colors hover:bg-party-gold/10"
          aria-label="Назад"
        >
          <ArrowLeft size={22} />
        </button>
      ) : (
        <div className="w-10" />
      )}

      <h1 className="party-title text-lg font-semibold tracking-widest text-party-gold-light">
        {title}
      </h1>

      {showInfo ? (
        <button
          onClick={onInfoClick}
          className="flex h-10 w-10 items-center justify-center rounded-full text-party-gold transition-colors hover:bg-party-gold/10"
          aria-label="Інформація"
        >
          <Info size={22} />
        </button>
      ) : (
        <div className="w-10" />
      )}
    </header>
  );
}
