"use client";

import { useEffect, useState } from "react";
import { Check, HelpCircle, Play, Square, X } from "lucide-react";

type QuestCell = { guessedName: string; isCorrect: boolean } | null;

type ResultsMatrix = {
  questions: { index: number; label: string; correctAuthorId: string }[];
  guests: { id: string; name: string }[];
  cells: Record<string, Record<number, QuestCell>>;
};

export default function AdminQuestPanel() {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(false);
  const [hasRound, setHasRound] = useState(false);
  const [questionCount, setQuestionCount] = useState(0);
  const [matrix, setMatrix] = useState<ResultsMatrix | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (open) loadStatus();
  }, [open]);

  async function loadStatus() {
    const res = await fetch("/api/admin/quest");
    if (res.ok) {
      const data = await res.json();
      setActive(data.settings?.secret_quest_active || false);
      setHasRound(!!data.round);
      setQuestionCount(data.questionCount || 0);
      setMatrix(data.resultsMatrix || null);
    }
  }

  async function toggleActive() {
    setLoading(true);
    setMessage("");
    const res = await fetch("/api/admin/quest", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secret_quest_active: !active }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMessage(data.error || "Помилка");
    } else {
      setActive(data.settings.secret_quest_active);
      setMessage(
        data.settings.secret_quest_active ? "Квест увімкнено" : "Квест вимкнено"
      );
    }
    setLoading(false);
    setTimeout(() => setMessage(""), 3000);
  }

  async function startRound() {
    setLoading(true);
    setMessage("");
    const res = await fetch("/api/admin/quest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "start" }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMessage(data.error || "Помилка");
    } else {
      setHasRound(true);
      setMessage("Новий раунд почався!");
      await loadStatus();
    }
    setLoading(false);
    setTimeout(() => setMessage(""), 4000);
  }

  async function endRound() {
    if (
      !confirm(
        "Завершити раунд? Авторам, чий факт ніхто не вгадав, нарахується $300."
      )
    )
      return;
    setLoading(true);
    setMessage("");
    const res = await fetch("/api/admin/quest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "end" }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMessage(data.error || "Помилка");
    } else {
      setHasRound(false);
      setMatrix(null);
      const count = data.awardedAuthors ?? 0;
      setMessage(
        count > 0
          ? `Раунд завершено! $300 нараховано ${count} авторам.`
          : "Раунд завершено!"
      );
    }
    setLoading(false);
    setTimeout(() => setMessage(""), 4000);
  }

  const hasAnyAnswers = matrix
    ? Object.values(matrix.cells).some((row) =>
        Object.values(row).some((cell) => cell !== null)
      )
    : false;

  return (
    <div className="party-card mt-4 border-party-gold/50 p-5">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <HelpCircle size={18} className="text-party-gold" />
          <h3 className="party-title text-sm font-semibold text-party-gold">
            СЕКРЕТНИЙ КВЕСТ
          </h3>
        </div>
        <span className="text-xs text-party-gold">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div className="mt-4 space-y-4">
          <p className="text-xs text-party-cream/50">
            Гості вгадують авторів цікавих фактів по одному — як у «Хто хоче
            стати мільйонером». Потрібно хоча б 1 заповнений факт.
          </p>

          <p className="text-xs text-party-gold/70">
            Заповнено питань: {questionCount}
          </p>

          <label className="flex items-center gap-2 text-sm text-party-cream/80">
            <input
              type="checkbox"
              checked={active}
              onChange={toggleActive}
              disabled={loading}
              className="accent-party-gold"
            />
            Квест активний (кнопка на головній)
          </label>

          <button
            onClick={startRound}
            disabled={loading || !active || questionCount < 1}
            className="party-btn flex w-full items-center justify-center gap-2 py-3 text-xs font-semibold tracking-widest disabled:opacity-40"
          >
            <Play size={16} />
            ПОЧАТИ НОВИЙ РАУНД
          </button>

          {hasRound && (
            <button
              onClick={endRound}
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-400/40 py-3 text-xs font-semibold tracking-widest text-red-400 disabled:opacity-40"
            >
              <Square size={16} />
              ЗАВЕРШИТИ РАУНД
            </button>
          )}

          {hasRound && matrix && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-semibold tracking-widest text-party-gold/60">
                  ВІДПОВІДІ ГОСТЕЙ
                </p>
                <button
                  onClick={loadStatus}
                  className="text-[10px] text-party-gold/60 underline"
                >
                  Оновити
                </button>
              </div>

              {!hasAnyAnswers ? (
                <p className="text-xs text-party-cream/40">
                  Поки ніхто не відповів
                </p>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-party-cream/10">
                  <table className="w-full min-w-[480px] text-left text-[10px]">
                    <thead>
                      <tr className="border-b border-party-cream/10 text-party-gold/60">
                        <th className="sticky left-0 z-10 min-w-[140px] bg-[#3a1012] px-2 py-2 font-semibold">
                          Факт
                        </th>
                        {matrix.guests.map((guest) => (
                          <th
                            key={guest.id}
                            className="min-w-[72px] px-2 py-2 text-center font-semibold whitespace-nowrap"
                          >
                            {guest.name}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {matrix.questions.map((q) => (
                        <tr
                          key={q.index}
                          className="border-b border-party-cream/5 text-party-cream/80"
                        >
                          <td
                            className="sticky left-0 z-10 max-w-[160px] bg-[#3a1012] px-2 py-2 align-top leading-snug"
                            title={q.label}
                          >
                            {q.label}
                          </td>
                          {matrix.guests.map((guest) => {
                            const isAuthor = guest.id === q.correctAuthorId;
                            const cell = matrix.cells[guest.id]?.[q.index];

                            if (isAuthor) {
                              return (
                                <td
                                  key={guest.id}
                                  className="px-2 py-2 text-center text-party-cream/25"
                                >
                                  —
                                </td>
                              );
                            }

                            if (!cell) {
                              return (
                                <td
                                  key={guest.id}
                                  className="px-2 py-2 text-center text-party-cream/25"
                                >
                                  …
                                </td>
                              );
                            }

                            return (
                              <td key={guest.id} className="px-2 py-2 text-center">
                                <div className="flex flex-col items-center gap-0.5">
                                  <span className="whitespace-nowrap">
                                    {cell.guessedName}
                                  </span>
                                  {cell.isCorrect ? (
                                    <Check
                                      size={12}
                                      className="text-green-400"
                                    />
                                  ) : (
                                    <X size={12} className="text-red-400" />
                                  )}
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {message && <p className="text-sm text-party-gold">{message}</p>}
        </div>
      )}
    </div>
  );
}
