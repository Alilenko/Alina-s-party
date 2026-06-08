"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Wine, Gift, User, Trophy } from "lucide-react";
import { useMounted } from "@/lib/use-mounted";

const navItems = [
  { href: "/", icon: Home, label: "Головна" },
  { href: "/feed", icon: Wine, label: "Вечірка" },
  { href: "/tasks", icon: Gift, label: "Завдання", center: true },
  { href: "/rating", icon: Trophy, label: "Рейтинг" },
  { href: "/profile", icon: User, label: "Профіль" },
];

export default function BottomNav() {
  const pathname = usePathname();
  const mounted = useMounted();

  if (pathname === "/login") return null;

  return (
    <nav className="fixed bottom-0 left-1/2 z-50 w-full max-w-[767px] -translate-x-1/2 border-t border-party-gold/20 bg-[#3a1012]/95 px-4 py-2 backdrop-blur-md">
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const isActive =
            mounted &&
            (pathname === item.href ||
              (item.href === "/profile" && pathname.startsWith("/participants")));
          const Icon = item.icon;

          if (item.center) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex h-14 w-14 -mt-6 items-center justify-center rounded-full border-2 transition-all ${
                  isActive
                    ? "border-party-gold bg-party-gold text-party-bg shadow-lg shadow-party-gold/30"
                    : "border-party-gold/60 bg-party-gold/20 text-party-gold"
                }`}
              >
                <Icon size={24} />
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 px-2 py-1 transition-colors ${
                isActive ? "text-party-gold" : "text-party-cream/50"
              }`}
            >
              <Icon size={22} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
