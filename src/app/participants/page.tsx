"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import BottomNav from "@/components/BottomNav";
import Avatar from "@/components/Avatar";
import { createClient } from "@/lib/supabase";
import { fetchAllParticipants } from "@/lib/participants-query";
import type { Participant } from "@/lib/types";
import { Crown } from "lucide-react";

export default function ParticipantsPage() {
  const [participants, setParticipants] = useState<Participant[]>([]);

  useEffect(() => {
    fetchAllParticipants(createClient()).then(setParticipants);
  }, []);

  return (
    <div className="pb-24">
      <PageHeader title="ГОСТІ" />

      <div className="space-y-2 px-4">
        {participants.map((p) => (
          <Link
            key={p.id}
            href={`/participants/${p.id}`}
            className="party-card flex items-center gap-4 p-4 transition-all hover:border-party-gold/50"
          >
            <Avatar src={p.photo_url} name={p.name} size="md" />
            <div className="flex-1">
              <p className="font-medium text-party-cream">{p.name}</p>
              {p.is_birthday_girl && (
                <div className="mt-0.5 inline-flex items-center gap-1 text-xs text-party-gold">
                  <Crown size={10} />
                  Іменинниця
                </div>
              )}
              {p.about_me && (
                <p className="mt-1 line-clamp-1 text-xs text-party-cream/50">
                  {p.about_me}
                </p>
              )}
            </div>
            <span className="font-bold text-party-gold">${p.balance}</span>
          </Link>
        ))}
      </div>

      <BottomNav />
    </div>
  );
}
