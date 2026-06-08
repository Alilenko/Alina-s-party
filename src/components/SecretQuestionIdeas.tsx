"use client";

import { X, Lightbulb } from "lucide-react";
import { SECRET_QUESTION_IDEAS } from "@/lib/secret-question-ideas";

interface SecretQuestionIdeasProps {
  open: boolean;
  onClose: () => void;
  onSelect?: (idea: string) => void;
}

export default function SecretQuestionIdeas({
  open,
  onClose,
  onSelect,
}: SecretQuestionIdeasProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60">
      <div className="safe-bottom-sheet w-full max-w-[767px] rounded-t-2xl border border-party-gold/30 bg-[#3a1012]">
        <div className="flex items-center justify-between border-b border-party-gold/20 px-4 py-4">
          <div className="flex items-center gap-2">
            <Lightbulb size={18} className="text-party-gold" />
            <p className="text-sm font-medium text-party-cream">Список ідей</p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-party-gold/60 hover:bg-party-gold/10"
          >
            <X size={18} />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto px-4 py-3">
          {SECRET_QUESTION_IDEAS.map((idea) => (
            <button
              key={idea}
              type="button"
              onClick={() => {
                onSelect?.(idea);
                onClose();
              }}
              className="mb-2 w-full rounded-xl border border-party-gold/20 bg-black/20 px-4 py-3 text-left text-sm text-party-cream transition-all hover:border-party-gold/40 hover:bg-party-gold/10"
            >
              {idea}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
