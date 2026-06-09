import Link from "next/link";
import { getSessionParticipant } from "@/lib/auth";
import { createServerSupabase } from "@/lib/supabase-server";
import BalanceCard from "@/components/BalanceCard";
import BottomNav from "@/components/BottomNav";
import HomeHero from "@/components/HomeHero";
import { User, ClipboardList, Trophy, Camera, HelpCircle } from "lucide-react";
import { getActiveRound, getPartySettings } from "@/lib/secret-quest";

const menuItems = [
  { href: "/profile", label: "ПРОФІЛЬ", icon: User },
  { href: "/tasks", label: "ЗАВДАННЯ", icon: ClipboardList },
  { href: "/rating", label: "РЕЙТИНГ", icon: Trophy },
];

export default async function HomePage() {
  const participant = await getSessionParticipant();
  const supabase = await createServerSupabase();

  const { data: birthdayGirl } = await supabase
    .from("participants")
    .select("name, photo_url")
    .eq("is_birthday_girl", true)
    .single();

  const settings = await getPartySettings(supabase);
  const questRound = await getActiveRound(supabase);
  const questLive = settings.secret_quest_active && !!questRound;

  return (
    <div className="relative min-h-dvh pb-24">
      <div
        className="pointer-events-none fixed inset-y-0 left-1/2 z-0 w-full max-w-[767px] -translate-x-1/2 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/hero-bg.jpg')" }}
        aria-hidden
      />
      <div
        className="pointer-events-none fixed inset-y-0 left-1/2 z-0 w-full max-w-[767px] -translate-x-1/2 bg-gradient-to-b from-black/25 via-black/45 to-[#1a0506]/95"
        aria-hidden
      />

      <div className="relative z-10">
        <HomeHero
          portraitUrl={birthdayGirl?.photo_url}
          name={birthdayGirl?.name}
        />

        <div className="px-4">
          <BalanceCard balance={participant?.balance || 0} />
        </div>

        <div className="mx-4 mt-3 grid grid-cols-3 gap-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="party-card flex flex-col items-center gap-1.5 p-3 transition-all hover:border-party-gold/60"
              >
                <Icon size={22} className="text-party-gold" />
                <span className="text-xs font-semibold tracking-widest text-party-gold-light">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>

        <div className="mx-4 mt-2 space-y-1.5">
          {questLive && (
            <Link
              href="/quest"
              className="party-btn flex w-full items-center justify-center gap-2 border-party-gold bg-party-gold/20 py-2.5 text-[10px] font-semibold tracking-widest text-party-gold-light"
            >
              <HelpCircle size={14} />
              СЕКРЕТНИЙ КВЕСТ — ГРАЄМО!
            </Link>
          )}
          <Link
            href="/photos"
            className="party-btn flex w-full items-center justify-center gap-2 py-2 text-[10px] font-semibold tracking-widest"
          >
            <Camera size={14} />
            ФОТО ВЕЧІРКИ
          </Link>
          <Link
            href="/participants"
            className="party-btn flex w-full items-center justify-center gap-2 py-2 text-[10px] font-semibold tracking-widest"
          >
            <User size={14} />
            ГОСТІ ВЕЧІРКИ
          </Link>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
