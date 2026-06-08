"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import BottomNav from "@/components/BottomNav";
import Avatar from "@/components/Avatar";
import { createClient } from "@/lib/supabase";
import { fetchAllParticipants } from "@/lib/participants-query";
import { sortByRating } from "@/lib/sort-participants";
import type { Participant } from "@/lib/types";
import { Crown } from "lucide-react";

function PodiumCard({
  participant,
  place,
  crownClass,
  heightClass,
}: {
  participant: Participant;
  place: number;
  crownClass: string;
  heightClass: string;
}) {
  return (
    <Link
      href={`/participants/${participant.id}`}
      className="flex w-24 flex-col items-center"
    >
      <Crown size={16} className={crownClass} />
      <Avatar
        src={participant.photo_url}
        name={participant.name}
        size="md"
        shape="square"
        className="mt-1"
      />
      <p className="mt-1 text-xs font-medium text-party-cream">{participant.name}</p>
      <p className="text-sm font-bold text-party-gold">${participant.balance}</p>
      <div className={`mt-1 w-full rounded-t-lg bg-party-gold/20 ${heightClass}`} />
      <span className="mt-1 text-[10px] text-party-cream/40">{place} місце</span>
    </Link>
  );
}

export default function RatingPage() {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [currentId, setCurrentId] = useState<string | null>(null);

  useEffect(() => {
    loadRating();

    const supabase = createClient();
    const channel = supabase
      .channel("rating-updates")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "participants" },
        () => loadRating()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function loadRating() {
    const supabase = createClient();
    const profileRes = await fetch("/api/profile");
    const { participant } = await profileRes.json();
    if (participant) setCurrentId(participant.id);

    const data = await fetchAllParticipants(supabase);
    setParticipants(data);
  }

  const hasRating = useMemo(
    () => participants.some((p) => p.balance > 0),
    [participants]
  );

  const sorted = useMemo(() => sortByRating(participants), [participants]);
  const ranked = useMemo(() => sorted.filter((p) => p.balance > 0), [sorted]);
  const top3 = ranked.slice(0, 3);

  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      <PageHeader title="РЕЙТИНГ" showInfo />

      {!hasRating && (
        <p className="mx-4 mb-3 shrink-0 text-center text-xs text-party-cream/50">
          Рейтинг з&apos;явиться, коли гості почнуть заробляти
        </p>
      )}

      {hasRating && top3.length > 0 && (
        <div className="mx-4 mb-4 flex shrink-0 items-end justify-center gap-3">
          {top3.length === 1 && (
            <PodiumCard
              participant={top3[0]}
              place={1}
              crownClass="text-yellow-400"
              heightClass="h-16"
            />
          )}

          {top3.length === 2 && (
            <>
              <PodiumCard
                participant={top3[1]}
                place={2}
                crownClass="text-gray-300"
                heightClass="h-12"
              />
              <PodiumCard
                participant={top3[0]}
                place={1}
                crownClass="text-yellow-400"
                heightClass="h-16"
              />
              <div className="w-24" />
            </>
          )}

          {top3.length >= 3 && (
            <>
              <PodiumCard
                participant={top3[1]}
                place={2}
                crownClass="text-gray-300"
                heightClass="h-12"
              />
              <PodiumCard
                participant={top3[0]}
                place={1}
                crownClass="text-yellow-400"
                heightClass="h-16"
              />
              <PodiumCard
                participant={top3[2]}
                place={3}
                crownClass="text-amber-600"
                heightClass="h-8"
              />
            </>
          )}
        </div>
      )}

      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-28">
        <div className="space-y-2">
          {sorted.map((p) => {
            const isMe = p.id === currentId;
            const rankIndex = ranked.findIndex((r) => r.id === p.id);
            const showRank = rankIndex >= 0;

            return (
              <Link
                key={p.id}
                href={`/participants/${p.id}`}
                className={`party-card flex items-center gap-3 p-3 transition-all hover:border-party-gold/50 ${
                  isMe ? "border-party-gold/60 bg-party-gold/10" : ""
                }`}
              >
                <span className="w-6 text-center text-sm font-bold text-party-gold/60">
                  {showRank ? rankIndex + 1 : ""}
                </span>
                <Avatar
                  src={p.photo_url}
                  name={p.name}
                  size="sm"
                  shape="square"
                />
                <span className="flex-1 text-sm text-party-cream">
                  {p.name}
                  {isMe && (
                    <span className="ml-2 text-xs text-party-gold">(ти)</span>
                  )}
                </span>
                <span className="font-bold text-party-gold">${p.balance}</span>
              </Link>
            );
          })}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
