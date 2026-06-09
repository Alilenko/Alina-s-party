"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import BottomNav from "@/components/BottomNav";
import Avatar from "@/components/Avatar";
import AdminTasksPanel from "@/components/AdminTasksPanel";
import AdminGuestsPanel from "@/components/AdminGuestsPanel";
import AdminQuestPanel from "@/components/AdminQuestPanel";
import SecretQuestionIdeas from "@/components/SecretQuestionIdeas";
import {
  PROFILE_FIELDS,
  EMPTY_PROFILE_FORM,
  PROFILE_COMPLETE_REWARD,
  participantToForm,
  type ProfileFormData,
} from "@/lib/profile-fields";
import type { Participant } from "@/lib/types";
import { Crown, Camera, LogOut, HelpCircle, Lightbulb } from "lucide-react";

export default function ProfilePage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [participant, setParticipant] = useState<Participant | null>(null);
  const [editingProfile, setEditingProfile] = useState(false);
  const [editingSecret, setEditingSecret] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingSecret, setSavingSecret] = useState(false);
  const [form, setForm] = useState<ProfileFormData>(EMPTY_PROFILE_FORM);
  const [ideasOpen, setIdeasOpen] = useState(false);

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((data) => {
        if (data.participant) {
          setParticipant(data.participant);
          setForm(participantToForm(data.participant));
        }
      });
  }, []);

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", "avatars");

    const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
    const uploadData = await uploadRes.json();

    if (uploadData.url) {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photo_url: uploadData.url }),
      });
      const data = await res.json();
      if (data.participant) {
        setParticipant(data.participant);
        if (data.profileRewardGranted) {
          alert(`Профіль заповнено! +$${data.profileReward ?? PROFILE_COMPLETE_REWARD}`);
        }
      }
    }
  }

  async function handleSaveProfile() {
    setSavingProfile(true);
    const { secret_question: _, quote: __, ...profileData } = form;
    const res = await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profileData),
    });
    const data = await res.json();
    if (data.participant) {
      setParticipant(data.participant);
      setForm((prev) => ({
        ...participantToForm(data.participant),
        secret_question: prev.secret_question,
      }));
      setEditingProfile(false);
      if (data.profileRewardGranted) {
        alert(`Профіль заповнено! +$${data.profileReward ?? PROFILE_COMPLETE_REWARD}`);
      } else if (data.strippedFields?.length) {
        alert(
          `Збережено частково. Ці поля не записались у базу — запусти migration-profile-fields.sql у Supabase:\n\n• ${data.strippedFields.join("\n• ")}`
        );
      }
    } else {
      alert(data.error || "Не вдалося зберегти профіль");
    }
    setSavingProfile(false);
  }

  async function handleSaveSecret() {
    setSavingSecret(true);
    const res = await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secret_question: form.secret_question }),
    });
    const data = await res.json();
    if (data.participant) {
      setParticipant(data.participant);
      setForm(participantToForm(data.participant));
      setEditingSecret(false);
    } else {
      alert(data.error || "Не вдалося зберегти цікавий факт");
    }
    setSavingSecret(false);
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  function updateField(key: keyof ProfileFormData, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  if (!participant) {
    return (
      <div className="flex min-h-dvh items-center justify-center pb-24">
        <p className="text-party-cream/50">Завантаження...</p>
      </div>
    );
  }

  return (
    <div className="pb-24">
      <PageHeader title="ПРОФІЛЬ" showBack={false} />

      <div className="px-4">
        <div className="relative mx-auto mb-4 w-fit">
          <Avatar src={participant.photo_url} name={participant.name} size="xl" />
          <button
            onClick={() => fileRef.current?.click()}
            className="absolute bottom-0 right-0 flex h-10 w-10 items-center justify-center rounded-full border border-party-gold bg-party-bg text-party-gold"
          >
            <Camera size={18} />
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handlePhotoUpload}
          />
        </div>

        <div className="text-center">
          <h2 className="text-xl font-semibold text-party-cream">{participant.name}</h2>
          {participant.is_birthday_girl && (
            <div className="mt-1 inline-flex items-center gap-1 rounded-full border border-party-gold/40 px-3 py-1 text-xs text-party-gold">
              <Crown size={12} />
              Іменинниця
            </div>
          )}
        </div>

        <div className="party-card mt-6 p-5">
          <p className="mb-4 text-xs leading-relaxed text-party-cream/50">
            Заповни всі поля нижче — отримаєш{" "}
            <span className="text-party-gold">${PROFILE_COMPLETE_REWARD}</span>.
          </p>

          <div className="mb-4 flex items-center justify-between">
            <h3 className="party-title text-sm font-semibold text-party-gold">ПРО МЕНЕ</h3>
            <button
              onClick={() =>
                editingProfile ? handleSaveProfile() : setEditingProfile(true)
              }
              className="text-xs text-party-gold hover:underline"
            >
              {editingProfile
                ? savingProfile
                  ? "..."
                  : "ЗБЕРЕГТИ"
                : "РЕДАГУВАТИ"}
            </button>
          </div>

          <div className="space-y-4">
            {PROFILE_FIELDS.map((field) => {
              const Icon = field.icon;
              const value = form[field.key];

              return (
                <div key={field.key} className="flex gap-3">
                  <Icon size={18} className="mt-0.5 shrink-0 text-party-gold" />
                  <div className="flex-1">
                    <p className="text-xs text-party-gold/60">{field.label}</p>
                    {editingProfile ? (
                      "multiline" in field && field.multiline ? (
                        <textarea
                          value={value}
                          onChange={(e) => updateField(field.key, e.target.value)}
                          className="party-input mt-1 min-h-[72px] resize-none text-sm"
                          placeholder={field.placeholder}
                        />
                      ) : (
                        <input
                          value={value}
                          onChange={(e) => updateField(field.key, e.target.value)}
                          className="party-input mt-1 text-sm"
                          placeholder={field.placeholder}
                        />
                      )
                    ) : (
                      <p className="mt-0.5 text-sm text-party-cream/80">
                        {value || (
                          <span className="text-party-cream/30">Не заповнено</span>
                        )}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="party-card mt-4 p-5">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <HelpCircle size={18} className="text-party-gold" />
              <h3 className="party-title text-sm font-semibold text-party-gold">
                ЦІКАВИЙ ФАКТ
              </h3>
            </div>
            <button
              onClick={() =>
                editingSecret ? handleSaveSecret() : setEditingSecret(true)
              }
              className="text-xs text-party-gold hover:underline"
            >
              {editingSecret
                ? savingSecret
                  ? "..."
                  : "ЗБЕРЕГТИ"
                : "РЕДАГУВАТИ"}
            </button>
          </div>

          <p className="mb-3 text-xs leading-relaxed text-party-cream/50">
            Напиши цікавий факт про себе — інші спробують вгадати, чий він.
            Якщо ніхто не вгадає — ти отримаєш <span className="text-party-gold">$300</span> після
            завершення раунду. За кожну правильну відповідь гість одразу отримує{" "}
            <span className="text-party-gold">$100</span>.
          </p>

          <button
            type="button"
            onClick={() => setIdeasOpen(true)}
            className="mb-3 flex items-center gap-2 text-xs text-party-gold hover:underline"
          >
            <Lightbulb size={14} />
            Список ідей
          </button>

          {editingSecret ? (
            <textarea
              value={form.secret_question}
              onChange={(e) => updateField("secret_question", e.target.value)}
              className="party-input min-h-[80px] resize-none text-sm"
              placeholder="Напиши цікавий факт про себе — інші спробують вгадати, що це ти..."
            />
          ) : (
            <p className="text-sm text-party-cream/80">
              {form.secret_question || (
                <span className="text-party-cream/30">Ще не додано</span>
              )}
            </p>
          )}
        </div>

        {participant.is_birthday_girl && (
          <>
            <AdminQuestPanel />
            <AdminGuestsPanel />
            <AdminTasksPanel />
          </>
        )}

        <SecretQuestionIdeas
          open={ideasOpen}
          onClose={() => setIdeasOpen(false)}
          onSelect={(idea) => {
            updateField("secret_question", idea);
            setEditingSecret(true);
          }}
        />

        <button
          onClick={handleLogout}
          className="mt-6 flex w-full items-center justify-center gap-2 py-3 text-sm text-party-cream/40 hover:text-party-cream/60"
        >
          <LogOut size={16} />
          Вийти
        </button>
      </div>

      <BottomNav />
    </div>
  );
}
