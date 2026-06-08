"use client";

import { useEffect, useState } from "react";
import { UserPlus, Users } from "lucide-react";
import type { Participant } from "@/lib/types";
import { slugify } from "@/lib/slugify";

export default function AdminGuestsPanel() {
  const [open, setOpen] = useState(false);
  const [guests, setGuests] = useState<Participant[]>([]);
  const [name, setName] = useState("");
  const [password, setPassword] = useState("guest2026");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (open) loadGuests();
  }, [open]);

  async function loadGuests() {
    const res = await fetch("/api/admin/participants");
    if (res.ok) {
      const data = await res.json();
      setGuests(data.participants || []);
    }
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    const res = await fetch("/api/admin/participants", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, password }),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Помилка");
      setSaving(false);
      return;
    }

    setSuccess(`${data.participant.name} додано! Пароль: ${data.password}`);
    setName("");
    setPassword("guest2026");
    await loadGuests();
    setSaving(false);
    setTimeout(() => setSuccess(""), 8000);
  }

  const previewSlug = name.trim() ? slugify(name) : "";

  return (
    <div className="party-card mt-4 border-party-gold/50 p-5">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <Users size={18} className="text-party-gold" />
          <h3 className="party-title text-sm font-semibold text-party-gold">ГОСТІ</h3>
        </div>
        <span className="text-xs text-party-gold">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div className="mt-4 space-y-4">
          <form onSubmit={handleAdd} className="space-y-3">
            <div>
              <label className="mb-1 block text-xs text-party-gold/70">Ім&apos;я гостя</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="party-input text-sm"
                placeholder="Наприклад: Василь"
                required
              />
              {previewSlug && (
                <p className="mt-1 text-[10px] text-party-cream/40">
                  Логін: {previewSlug}
                </p>
              )}
            </div>

            <div>
              <label className="mb-1 block text-xs text-party-gold/70">Пароль</label>
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="party-input text-sm"
                placeholder="guest2026"
                required
              />
            </div>

            {error && <p className="text-sm text-red-400">{error}</p>}
            {success && <p className="text-sm text-green-400">{success}</p>}

            <button
              type="submit"
              disabled={saving}
              className="party-btn flex w-full items-center justify-center gap-2 py-3 text-xs font-semibold tracking-widest disabled:opacity-50"
            >
              <UserPlus size={16} />
              {saving ? "ДОДАЄМО..." : "ДОДАТИ ГОСТЯ"}
            </button>
          </form>

          <div className="border-t border-party-gold/20 pt-4">
            <p className="mb-2 text-xs text-party-gold/60">
              Усі гості ({guests.length})
            </p>
            <div className="max-h-36 space-y-1 overflow-y-auto">
              {guests.map((g) => (
                <div
                  key={g.id}
                  className="flex items-center justify-between rounded-lg bg-black/20 px-3 py-2 text-xs"
                >
                  <span className="text-party-cream">
                    {g.name}
                    {g.is_birthday_girl && (
                      <span className="ml-1 text-party-gold">★</span>
                    )}
                  </span>
                  <span className="text-party-cream/40">{g.slug}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
