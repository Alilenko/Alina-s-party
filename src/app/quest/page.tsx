"use client";

import { useEffect, useMemo, useState } from "react";
import PageHeader from "@/components/PageHeader";
import BottomNav from "@/components/BottomNav";
import { CheckCircle2, HelpCircle, XCircle } from "lucide-react";

type QuestOption = { id: string; name: string; label: string };

type QuestQuestion = {
  index: number;
  question: string;
  isMine: boolean;
  options: QuestOption[];
};

type QuestResult = {
  questionIndex: number;
  questionText: string;
  guessedName: string;
  correctName: string;
  isCorrect: boolean;
};

export default function QuestPage() {
  const [active, setActive] = useState(false);
  const [questions, setQuestions] = useState<QuestQuestion[]>([]);
  const [guesses, setGuesses] = useState<Record<number, string>>({});
  const [results, setResults] = useState<QuestResult[]>([]);
  const [totalEarned, setTotalEarned] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [reviewing, setReviewing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lastReward, setLastReward] = useState<number | null>(null);

  const answerable = useMemo(
    () => questions.filter((q) => !q.isMine),
    [questions]
  );

  const totalSteps = answerable.length;
  const currentQuestion = answerable[currentStep];
  const allAnswered =
    totalSteps > 0 &&
    answerable.every((q) => guesses[q.index] !== undefined);

  useEffect(() => {
    loadQuest();
  }, []);

  async function loadQuest() {
    setLoading(true);
    const res = await fetch("/api/quest");
    const data = await res.json();
    setActive(data.active);
    setQuestions(data.questions || []);
    setResults(data.results || []);
    setTotalEarned(data.totalEarned || 0);

    const existing: Record<number, string> = {};
    (data.myGuesses || []).forEach(
      (g: { question_index: number; guessed_author_id: string }) => {
        existing[g.question_index] = g.guessed_author_id;
      }
    );
    setGuesses(existing);

    const toAnswer = (data.questions || []).filter(
      (q: QuestQuestion) => !q.isMine
    );
    const firstUnanswered = toAnswer.findIndex(
      (q: QuestQuestion) => !existing[q.index]
    );
    setCurrentStep(
      firstUnanswered === -1
        ? Math.max(0, toAnswer.length - 1)
        : firstUnanswered
    );
    setLoading(false);
  }

  async function handlePick(optionId: string) {
    if (!currentQuestion || saving) return;

    setSaving(true);
    setLastReward(null);
    const res = await fetch("/api/quest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        questionIndex: currentQuestion.index,
        guessedAuthorId: optionId,
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      alert(data.error || "Помилка");
      setSaving(false);
      return;
    }

    const data = await res.json();
    if (data.rewardDelta > 0) {
      setLastReward(data.rewardDelta);
      setTotalEarned((t) => t + data.rewardDelta);
    } else if (data.rewardDelta < 0) {
      setTotalEarned((t) => Math.max(0, t + data.rewardDelta));
    }

    const updated = { ...guesses, [currentQuestion.index]: optionId };
    setGuesses(updated);

    const nextUnanswered = answerable.findIndex(
      (q, i) => i > currentStep && !updated[q.index]
    );

    if (nextUnanswered !== -1) {
      setCurrentStep(nextUnanswered);
    } else if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      await loadQuest();
    }

    setSaving(false);
  }

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center pb-24">
        <p className="text-party-cream/50">Завантаження...</p>
      </div>
    );
  }

  return (
    <div className="pb-24">
      <PageHeader title="СЕКРЕТНИЙ КВЕСТ" />

      <div className="px-4">
        {!active && (
          <div className="party-card p-6 text-center">
            <HelpCircle className="mx-auto mb-3 text-party-gold/40" size={32} />
            <p className="text-sm text-party-cream/60">
              Квест ще не почався. Зачекай, поки Аліна його увімкне!
            </p>
          </div>
        )}

        {active && totalSteps === 0 && (
          <div className="party-card p-6 text-center">
            <p className="text-sm text-party-cream/60">
              У цьому раунді лише твій факт — вгадувати нічого 😊
            </p>
          </div>
        )}

        {active && totalSteps > 0 && allAnswered && !reviewing && (
          <div className="space-y-4">
            <div className="party-card border-party-gold/40 bg-party-gold/5 p-6 text-center">
              <CheckCircle2
                className="mx-auto mb-3 text-party-gold"
                size={40}
              />
              <p className="mb-1 text-sm font-semibold text-party-gold">
                Квест завершено!
              </p>
              <p className="text-xs text-party-cream/60">
                Зароблено:{" "}
                <span className="font-semibold text-party-gold">
                  ${totalEarned}
                </span>
              </p>
              <p className="mt-2 text-xs text-party-cream/50">
                Бонус $300 авторам нарахується, коли іменинниця завершить раунд.
              </p>
            </div>

            <div className="party-card p-4">
              <p className="mb-3 text-center text-[10px] font-semibold tracking-widest text-party-gold/60">
                ТВОЇ РЕЗУЛЬТАТИ
              </p>
              <div className="space-y-3">
                {results.map((r) => (
                  <div
                    key={r.questionIndex}
                    className={`rounded-xl border p-4 ${
                      r.isCorrect
                        ? "border-green-500/30 bg-green-500/5"
                        : "border-red-500/30 bg-red-500/5"
                    }`}
                  >
                    <div className="mb-2 flex items-start gap-2">
                      {r.isCorrect ? (
                        <CheckCircle2
                          className="mt-0.5 shrink-0 text-green-400"
                          size={18}
                        />
                      ) : (
                        <XCircle
                          className="mt-0.5 shrink-0 text-red-400"
                          size={18}
                        />
                      )}
                      <p className="text-sm leading-relaxed text-party-cream">
                        {r.questionText}
                      </p>
                    </div>
                    <div className="ml-7 space-y-1 text-xs">
                      <p className="text-party-cream/50">
                        Твоя відповідь:{" "}
                        <span
                          className={
                            r.isCorrect
                              ? "font-medium text-green-400"
                              : "font-medium text-red-400"
                          }
                        >
                          {r.guessedName}
                        </span>
                      </p>
                      {!r.isCorrect && (
                        <p className="text-party-cream/50">
                          Правильно:{" "}
                          <span className="font-medium text-party-gold">
                            {r.correctName}
                          </span>
                        </p>
                      )}
                      {r.isCorrect && (
                        <p className="font-medium text-party-gold">+$100</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => {
                setReviewing(true);
                setCurrentStep(0);
              }}
              className="w-full text-center text-xs text-party-gold/80 underline"
            >
              Переглянути відповіді ще раз
            </button>
          </div>
        )}

        {active && totalSteps > 0 && currentQuestion && (!allAnswered || reviewing) && (
          <>
            <div className="party-card mb-4 border-party-gold/40 bg-party-gold/5 p-4">
              <p className="text-xs leading-relaxed text-party-cream/70">
                Хто автор цього факту? Вгадай — одразу отримаєш{" "}
                <span className="text-party-gold">$100</span>. Якщо ніхто не
                вгадає — автор отримає{" "}
                <span className="text-party-gold">$300</span> після завершення
                раунду.
              </p>
            </div>

            {lastReward && (
              <div className="mb-4 rounded-xl border border-party-gold/40 bg-party-gold/10 px-4 py-3 text-center text-sm font-semibold text-party-gold">
                Правильно! +${lastReward}
              </div>
            )}

            <div className="mb-3 flex items-center justify-between text-[10px] font-semibold tracking-widest text-party-gold/60">
              <span>
                ФАКТ {currentStep + 1} / {totalSteps}
              </span>
              {guesses[currentQuestion.index] && (
                <span className="text-party-gold">✓ ВІДПОВІЛА(В)</span>
              )}
            </div>

            <div className="mb-2 h-1 overflow-hidden rounded-full bg-party-cream/10">
              <div
                className="h-full rounded-full bg-party-gold transition-all duration-300"
                style={{
                  width: `${((currentStep + 1) / totalSteps) * 100}%`,
                }}
              />
            </div>

            <div className="party-card mb-5 border-party-gold/30 p-5">
              <p className="text-center text-base leading-relaxed text-party-cream">
                {currentQuestion.question}
              </p>
            </div>

            <p className="mb-3 text-center text-[10px] font-semibold tracking-widest text-party-cream/40">
              ХТО АВТОР?
            </p>

            <div className="space-y-3">
              {currentQuestion.options.map((opt) => {
                const selected = guesses[currentQuestion.index] === opt.id;
                const resultForQuestion = results.find(
                  (r) => r.questionIndex === currentQuestion.index
                );
                const showResult = reviewing && resultForQuestion;
                const isCorrectOption =
                  showResult && opt.name === resultForQuestion.correctName;
                const isWrongPick =
                  showResult &&
                  selected &&
                  !resultForQuestion.isCorrect &&
                  opt.name === resultForQuestion.guessedName;

                return (
                  <button
                    key={opt.id}
                    onClick={() => handlePick(opt.id)}
                    disabled={saving}
                    className={`flex w-full items-center gap-4 rounded-xl border px-4 py-4 text-left transition-all disabled:opacity-50 ${
                      isCorrectOption
                        ? "border-green-500/50 bg-green-500/10"
                        : isWrongPick
                          ? "border-red-500/50 bg-red-500/10"
                          : selected
                            ? "border-party-gold bg-party-gold/20 shadow-[0_0_20px_rgba(212,175,55,0.15)]"
                            : "border-party-cream/15 bg-party-bg/60 hover:border-party-gold/40 hover:bg-party-gold/5"
                    }`}
                  >
                    <span
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                        isCorrectOption
                          ? "bg-green-500 text-white"
                          : isWrongPick
                            ? "bg-red-500 text-white"
                            : selected
                              ? "bg-party-gold text-party-bg"
                              : "bg-party-cream/10 text-party-gold"
                      }`}
                    >
                      {opt.label}
                    </span>
                    <span className="text-sm font-medium text-party-cream">
                      {opt.name}
                    </span>
                    {isCorrectOption && (
                      <CheckCircle2
                        className="ml-auto shrink-0 text-green-400"
                        size={18}
                      />
                    )}
                    {isWrongPick && (
                      <XCircle
                        className="ml-auto shrink-0 text-red-400"
                        size={18}
                      />
                    )}
                  </button>
                );
              })}
            </div>

            <div className="mt-6 flex gap-2">
              <button
                onClick={() => setCurrentStep((s) => Math.max(0, s - 1))}
                disabled={currentStep === 0}
                className="flex-1 rounded-xl border border-party-cream/15 py-3 text-xs font-semibold tracking-widest text-party-cream/60 disabled:opacity-30"
              >
                ← НАЗАД
              </button>
              {reviewing ? (
                <button
                  onClick={() => setReviewing(false)}
                  className="flex-1 rounded-xl border border-party-gold/40 py-3 text-xs font-semibold tracking-widest text-party-gold"
                >
                  ДО РЕЗУЛЬТАТІВ
                </button>
              ) : (
                <button
                  onClick={() =>
                    setCurrentStep((s) => Math.min(totalSteps - 1, s + 1))
                  }
                  disabled={currentStep >= totalSteps - 1}
                  className="flex-1 rounded-xl border border-party-cream/15 py-3 text-xs font-semibold tracking-widest text-party-cream/60 disabled:opacity-30"
                >
                  ДАЛІ →
                </button>
              )}
            </div>
          </>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
