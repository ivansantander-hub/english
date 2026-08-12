import { useState } from "react";

import type { Exercise, SubmitAnswerResult } from "../../lib/trpc-types.js";
import { trpc } from "../../lib/trpc.js";

const XP_PER_CORRECT = 10;

const EXERCISE_TYPE_LABELS: Record<string, string> = {
  translation_es_en: "Translate to English",
  translation_en_es: "Translate to Spanish",
  fill_blank: "Complete the sentence",
  correct_sentence: "Correct the sentence",
  free_writing: "Free writing",
  paragraph_translation: "Translate the paragraph",
};

export function ExerciseCard({
  exercise,
  onNext,
  nextLabel = "Next exercise",
}: {
  exercise: Exercise;
  onNext: (earnedXp: number) => void;
  nextLabel?: string;
}): React.JSX.Element {
  const submitAnswer = trpc.evaluation.submitAnswer.useMutation();
  const skipExercise = trpc.exercise.skip.useMutation();
  const [answer, setAnswer] = useState("");
  const result = submitAnswer.data;

  function handleSubmit(event: React.FormEvent): void {
    event.preventDefault();
    if (answer.trim().length === 0) return;
    submitAnswer.mutate({ exerciseId: exercise.id, rawAnswer: answer });
  }

  function handleNext(): void {
    const earnedXp = (result?.sentences.filter((s) => s.correct).length ?? 0) * XP_PER_CORRECT;
    setAnswer("");
    submitAnswer.reset();
    onNext(earnedXp);
  }

  function handleSkip(): void {
    skipExercise.mutate(
      { exerciseId: exercise.id },
      {
        onSuccess: () => {
          setAnswer("");
          onNext(0);
        },
      },
    );
  }

  return (
    <div className="space-y-6 rounded-[24px] bg-surface p-6 shadow-md">
      <section aria-labelledby="exercise-heading">
        <p className="mb-1 text-xs font-bold uppercase tracking-wide text-sky">
          {EXERCISE_TYPE_LABELS[exercise.type] ?? exercise.type}
        </p>
        <h2 id="exercise-heading" className="font-serif text-xl font-extrabold leading-snug text-ink">
          {exercise.spanishText ?? exercise.prompt}
        </h2>
        {exercise.contextHint && (
          <p className="mt-1 text-sm italic text-ink/50">{exercise.contextHint}</p>
        )}
      </section>

      <form onSubmit={handleSubmit} className="space-y-3">
        <label htmlFor="answer" className="block text-sm font-semibold text-ink/80">
          Your answer
        </label>
        <textarea
          id="answer"
          value={answer}
          onChange={(event) => setAnswer(event.target.value)}
          rows={exercise.type === "paragraph_translation" ? 5 : 2}
          disabled={submitAnswer.isPending || result !== undefined}
          className="w-full resize-none rounded-xl border border-ink/15 bg-paper p-3 text-base leading-relaxed text-ink shadow-sm focus:border-sky"
          placeholder="Write your answer in English…"
          autoFocus
        />
        {!result && (
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={submitAnswer.isPending || answer.trim().length === 0}
              className="rounded-xl bg-sky px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5 disabled:opacity-40 disabled:hover:translate-y-0"
            >
              {submitAnswer.isPending ? "Checking…" : "Check answer"}
            </button>
            <button
              type="button"
              onClick={handleSkip}
              disabled={skipExercise.isPending}
              className="text-sm font-semibold text-ink/50 transition hover:text-ink disabled:opacity-40"
            >
              {skipExercise.isPending ? "Skipping…" : "Skip this one"}
            </button>
          </div>
        )}
      </form>

      {result && <ResultPanel result={result} onNext={handleNext} nextLabel={nextLabel} />}
    </div>
  );
}

function ResultPanel({
  result,
  onNext,
  nextLabel,
}: {
  result: SubmitAnswerResult;
  onNext: () => void;
  nextLabel: string;
}): React.JSX.Element {
  const percent = Math.round(result.overallScore * 100);
  const correctCount = result.sentences.filter((s) => s.correct).length;
  const earnedXp = correctCount * XP_PER_CORRECT;

  return (
    <section aria-live="polite" className="space-y-4 border-t border-ink/10 pt-6">
      <div className="flex items-center gap-3">
        <p className="text-lg font-bold text-ink">
          Score: <span className={percent === 100 ? "text-mint" : "text-ink"}>{percent}%</span>
        </p>
        {earnedXp > 0 && (
          <span className="animate-stamp rounded-full bg-gold-tint px-2.5 py-0.5 font-mono text-xs font-bold text-ink">
            +{earnedXp} XP
          </span>
        )}
      </div>

      <ul className="space-y-3">
        {result.sentences.map((sentence) => (
          <li
            key={sentence.sentenceIndex}
            className={`rounded-xl p-3 ${sentence.correct ? "bg-mint-tint" : "bg-berry-tint"}`}
          >
            <p className="font-semibold text-ink">
              {sentence.correct ? "✓" : "✗"} {sentence.text || <em>(no answer)</em>}
            </p>
            {sentence.errors.map((error, index) => (
              <div key={index} className="mt-2 text-sm text-ink/70">
                <p>
                  <span className="font-bold capitalize">{error.type.replace(/_/g, " ")}:</span>{" "}
                  {error.explanation}
                </p>
                <p className="italic text-ink/55">{error.explanationEs}</p>
                {error.correctedText && (
                  <p className="mt-0.5 text-ink/60">
                    Correct: <span className="font-semibold text-ink">{error.correctedText}</span>
                  </p>
                )}
              </div>
            ))}
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={onNext}
        className="rounded-xl bg-sky px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5"
      >
        {nextLabel}
      </button>
    </section>
  );
}
