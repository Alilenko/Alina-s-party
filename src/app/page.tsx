import Link from "next/link";
import { getSessionParticipant } from "@/lib/auth";
import { createServerSupabase } from "@/lib/supabase-server";
import BalanceCard from "@/components/BalanceCard";
import BottomNav from "@/components/BottomNav";
import Avatar from "@/components/Avatar";
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
    .select("*")
    .eq("is_birthday_girl", true)
    .single();

  const settings = await getPartySettings(supabase);
  const questRound = await getActiveRound(supabase);
  const questLive = settings.secret_quest_active && !!questRound;

  return (
    <div className="pb-24">
      <header className="px-4 pt-8 text-center">
        <h1 className="party-title text-2xl font-bold text-party-gold-light">
          Alina&apos;s Party
        </h1>
        <p className="mt-1 text-sm text-party-cream/60">Свято починається тут</p>
      </header>

      <div className="mx-auto my-6 flex justify-center">
        <Avatar
          src={birthdayGirl?.photo_url}
          name={birthdayGirl?.name || "Аліна"}
          size="xl"
        />
      </div>

      <BalanceCard balance={participant?.balance || 0} />

      <div className="mx-4 mt-6 grid grid-cols-3 gap-3">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="party-card flex flex-col items-center gap-3 p-6 transition-all hover:border-party-gold/60"
            >
              <Icon size={28} className="text-party-gold" />
              <span className="text-xs font-semibold tracking-widest text-party-gold-light">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>

      <div className="mx-4 mt-4 space-y-2">
        {questLive && (
          <Link
            href="/quest"
            className="party-btn flex w-full items-center justify-center gap-2 border-party-gold bg-party-gold/20 py-4 text-xs font-semibold tracking-widest text-party-gold-light"
          >
            <HelpCircle size={16} />
            СЕКРЕТНИЙ КВЕСТ — ГРАЄМО!
          </Link>
        )}
        <Link
          href="/photos"
          className="party-btn flex w-full items-center justify-center gap-2 py-3 text-xs font-semibold tracking-widest"
        >
          <Camera size={16} />
          ФОТО ВЕЧІРКИ
        </Link>
        <Link
          href="/participants"
          className="party-btn flex w-full items-center justify-center gap-2 py-3 text-xs font-semibold tracking-widest"
        >
          <User size={16} />
          ГОСТІ ВЕЧІРКИ
        </Link>
      </div>

      <BottomNav />
    </div>
  );
}
