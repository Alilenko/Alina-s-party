"use client";

import { useEffect, useState } from "react";
import Avatar from "@/components/Avatar";
import { createClient } from "@/lib/supabase";
import { fetchAllParticipants } from "@/lib/participants-query";
import type { Participant } from "@/lib/types";
import { X, Check } from "lucide-react";

interface ParticipantPickerProps {
  open: boolean;
  taskTitle: string;
  currentUserId: string;
  excludedIds: string[];
  participants?: Participant[];
  requiresNote?: boolean;
  noteLabel?: string;
  notePlaceholder?: string;
  onSelect: (participant: Participant, note?: string) => void;
  onClose: () => void;
}

export default function ParticipantPicker({
  open,
  taskTitle,
  currentUserId,
  excludedIds,
  participants: participantsProp,
  requiresNote = false,
  noteLabel = "Додатково",
  notePlaceholder = "Введи текст...",
  onSelect,
  onClose,
}: ParticipantPickerProps) {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [selected, setSelected] = useState<Participant | null>(null);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) {
      setSelected(null);
      setNote("");
      return;
    }

    if (participantsProp && participantsProp.length > 0) {
      setParticipants(participantsProp);
      setLoading(false);
      return;
    }

    setLoading(true);
    fetchAllParticipants(createClient()).then((data) => {
      setParticipants(data);
      setLoading(false);
    });
  }, [open, participantsProp]);

  if (!open) return null;

  const available = participants.filter(
    (p) => p.id !== currentUserId && !excludedIds.includes(p.id)
  );

  const canConfirm = selected && (!requiresNote || note.trim().length > 0);

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60">
      <div className="safe-bottom-sheet w-full max-w-[767px] rounded-t-2xl border border-party-gold/30 bg-[#3a1012]">
        <div className="flex items-center justify-between border-b border-party-gold/20 px-4 py-4">
          <div>
            <p className="text-xs text-party-gold/60">Обери людину</p>
            <p className="text-sm font-medium text-party-cream">{taskTitle}</p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-party-gold/60 hover:bg-party-gold/10"
          >
            <X size={18} />
          </button>
        </div>

        <div className="max-h-64 overflow-y-auto px-4 py-3">
          {loading && (
            <p className="py-6 text-center text-sm text-party-cream/40">Завантаження...</p>
          )}

          {!loading && available.length === 0 && (
            <p className="py-6 text-center text-sm text-party-cream/40">
              Немає доступних гостей
            </p>
          )}

          {!loading &&
            available.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setSelected(p)}
                className={`mb-2 flex w-full items-center gap-3 rounded-xl border p-3 transition-all ${
                  selected?.id === p.id
                    ? "border-party-gold bg-party-gold/15"
                    : "border-party-gold/20 bg-black/20 hover:border-party-gold/40"
                }`}
              >
                <Avatar src={p.photo_url} name={p.name} size="sm" shape="square" />
                <span className="flex-1 text-left text-sm text-party-cream">{p.name}</span>
                {selected?.id === p.id && <Check size={16} className="text-party-gold" />}
              </button>
            ))}
        </div>

        {requiresNote && (
          <div className="px-4 pb-2">
            <label className="mb-1 block text-xs text-party-gold/70">{noteLabel}</label>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="party-input text-sm"
              placeholder={notePlaceholder}
            />
          </div>
        )}

        {excludedIds.length > 0 && (
          <p className="px-4 text-center text-[10px] text-party-cream/40">
            Вже обрані гості не показуються
          </p>
        )}

        <div className="mt-3 px-4">
          <button
            onClick={() => selected && onSelect(selected, note.trim() || undefined)}
            disabled={!canConfirm}
            className="party-btn w-full py-3 text-xs font-semibold tracking-widest disabled:opacity-40"
          >
            ПІДТВЕРДИТИ
          </button>
        </div>
      </div>
    </div>
  );
}
