"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import BottomNav from "@/components/BottomNav";
import Avatar from "@/components/Avatar";
import { createClient } from "@/lib/supabase";
import { PROFILE_FIELDS, hasProfileContent, getProfileValue } from "@/lib/profile-fields";
import type { Participant } from "@/lib/types";
import { Crown } from "lucide-react";

export default function ParticipantProfilePage() {
  const { id } = useParams<{ id: string }>();
  const [participant, setParticipant] = useState<Participant | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("participants")
      .select("*")
      .eq("id", id)
      .single()
      .then(({ data }) => setParticipant(data));
  }, [id]);

  if (!participant) {
    return (
      <div className="flex min-h-dvh items-center justify-center pb-24">
        <p className="text-party-cream/50">Завантаження...</p>
      </div>
    );
  }

  return (
    <div className="pb-24">
      <PageHeader title="ПРОФІЛЬ" />

      <div className="px-4">
        <div className="mx-auto mb-4 w-fit">
          <Avatar src={participant.photo_url} name={participant.name} size="xl" />
        </div>

        <div className="text-center">
          <h2 className="text-xl font-semibold text-party-cream">{participant.name}</h2>
          {participant.is_birthday_girl && (
            <div className="mt-1 inline-flex items-center gap-1 rounded-full border border-party-gold/40 px-3 py-1 text-xs text-party-gold">
              <Crown size={12} />
              Іменинниця
            </div>
          )}
          <p className="mt-2 text-lg font-bold text-party-gold">${participant.balance}</p>
        </div>

        <div className="party-card mt-6 space-y-4 p-5">
          <h3 className="party-title text-sm font-semibold text-party-gold">ПРО МЕНЕ</h3>

          {PROFILE_FIELDS.map((field) => {
            const value = getProfileValue(participant, field.key);
            if (!value) return null;
            const Icon = field.icon;

            return (
              <div key={field.key} className="flex gap-3">
                <Icon size={18} className="shrink-0 text-party-gold" />
                <div>
                  <p className="text-xs text-party-gold/60">{field.label}</p>
                  <p className="text-sm text-party-cream/80">{value}</p>
                </div>
              </div>
            );
          })}

          {!hasProfileContent(participant) && (
            <p className="text-sm text-party-cream/30">Ще не заповнив(ла) профіль</p>
          )}
        </div>

      </div>

      <BottomNav />
    </div>
  );
}
