"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import ResponsivePhoto from "@/components/ResponsivePhoto";
import PageHeader from "@/components/PageHeader";
import BottomNav from "@/components/BottomNav";
import Avatar from "@/components/Avatar";
import PhotoLightbox from "@/components/PhotoLightbox";
import TimeAgo from "@/components/TimeAgo";
import { createClient } from "@/lib/supabase";
import type { FeedEvent } from "@/lib/types";
import { Send, Camera } from "lucide-react";

export default function FeedPage() {
  const [events, setEvents] = useState<FeedEvent[]>([]);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [lightbox, setLightbox] = useState<{ src: string; caption: string } | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadFeed();

    const supabase = createClient();
    const channel = supabase
      .channel("feed-updates")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "feed_events" },
        () => loadFeed()
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "guest_messages" },
        () => loadFeed()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function loadFeed() {
    const supabase = createClient();
    const { data } = await supabase
      .from("feed_events")
      .select("*, participant:participants(*)")
      .order("created_at", { ascending: false })
      .limit(50);

    setEvents((data as FeedEvent[]) || []);
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim() || sending) return;
    setSending(true);

    await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: message }),
    });

    setMessage("");
    await loadFeed();
    setSending(false);
  }

  return (
    <div className="flex min-h-dvh flex-col pb-24">
      <PageHeader title="ВЕЧІРКА" />

      <div className="mx-4 mb-3">
        <Link
          href="/photos"
          className="party-btn flex items-center justify-center gap-2 py-2.5 text-xs font-semibold tracking-widest"
        >
          <Camera size={16} />
          ВСІ ФОТО ВЕЧІРКИ
        </Link>
      </div>

      <div className="mx-4 mb-4 overflow-hidden rounded-2xl">
        <div className="relative h-40 bg-gradient-to-b from-party-gold/20 to-party-bg">
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="party-title text-lg text-party-gold-light/60">
              🕯️ 🍷 🌸
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto px-4 scrollbar-hide">
        {events.length === 0 && (
          <p className="py-8 text-center text-sm text-party-cream/40">
            Поки що тихо... Скоро тут будуть події!
          </p>
        )}

        {events.map((event) => (
          <div key={event.id} className="party-card flex gap-3 p-3">
            <Avatar
              src={event.participant?.photo_url}
              name={event.participant?.name || "?"}
              size="sm"
            />
            <div className="flex-1">
              <p className="text-sm text-party-cream">
                <span className="font-semibold text-party-gold-light">
                  {event.participant?.name}
                </span>{" "}
                {event.event_type === "message" ? (
                  <span>&ldquo;{event.message}&rdquo;</span>
                ) : (
                  <span>{event.message}</span>
                )}
              </p>
              <div className="mt-1 flex items-center gap-2">
                <TimeAgo date={event.created_at} />
                {event.amount > 0 && (
                  <span className="text-xs font-bold text-party-gold">
                    +${event.amount}
                  </span>
                )}
              </div>
              {event.photo_url && (
                <button
                  type="button"
                  onClick={() =>
                    setLightbox({
                      src: event.photo_url!,
                      caption: `${event.participant?.name} — ${event.message}`,
                    })
                  }
                  className="mt-2 block w-full overflow-hidden rounded-lg border border-party-gold/30"
                >
                  <ResponsivePhoto src={event.photo_url} alt="Фото завдання" />
                </button>
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={sendMessage}
        className="fixed bottom-20 left-1/2 flex w-full max-w-[767px] -translate-x-1/2 gap-2 px-4"
      >
        <input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Напиши щось гостям..."
          className="party-input flex-1 text-sm"
          autoComplete="off"
          suppressHydrationWarning
        />
        <button
          type="submit"
          disabled={sending || !message.trim()}
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-party-gold/50 bg-party-gold/20 text-party-gold disabled:opacity-50"
        >
          <Send size={18} />
        </button>
      </form>

      {lightbox && (
        <PhotoLightbox
          src={lightbox.src}
          caption={lightbox.caption}
          onClose={() => setLightbox(null)}
        />
      )}

      <BottomNav />
    </div>
  );
}
