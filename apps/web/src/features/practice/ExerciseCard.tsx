import { useState } from "react";

import type { Exercise, SubmitAnswerResult } from "../../lib/trpc-types.js";
import { trpc } from "../../lib/trpc.js";

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
  onNext: () => void;
  nextLabel?: string;
}): React.JSX.Element {
  const submitAnswer = trpc.evaluation.submitAnswer.useMutation();
  const [answer, setAnswer] = useState("");
  const result = submitAnswer.data;

  function handleSubmit(event: React.FormEvent): void {
    event.preventDefault();
    if (answer.trim().length === 0) return;
    submitAnswer.mutate({ exerciseId: exercise.id, rawAnswer: answer });
  }

  function handleNext(): void {
    setAnswer("");
    submitAnswer.reset();
    onNext();
  }

  return (
    <div className="space-y-6">
      <section aria-labelledby="exercise-heading">
        <p className="mb-1 text-sm font-medium uppercase tracking-wide text-indigo-700">
          {EXERCISE_TYPE_LABELS[exercise.type] ?? exercise.type}
        </p>
        <h2 id="exercise-heading" className="font-serif text-xl leading-relaxed text-stone-900">
          {exercise.spanishText ?? exercise.prompt}
        </h2>
        {exercise.contextHint && (
          <p className="mt-1 text-sm italic text-stone-500">{exercise.contextHint}</p>
        )}
      </section>

      <form onSubmit={handleSubmit} className="space-y-3">
        <label htmlFor="answer" className="block text-sm font-medium text-stone-700">
          Your answer
        </label>
        <textarea
          id="answer"
          value={answer}
          onChange={(event) => setAnswer(event.target.value)}
          rows={exercise.type === "paragraph_translation" ? 5 : 2}
          disabled={submitAnswer.isPending || result !== undefined}
          className="w-full resize-none rounded border border-stone-300 bg-white p-3 text-base leading-relaxed shadow-sm focus:border-indigo-600"
          placeholder="Write your answer in English…"
          autoFocus
        />
        {!result && (
          <button
            type="submit"
            disabled={submitAnswer.isPending || answer.trim().length === 0}
            className="rounded bg-stone-900 px-4 py-2 text-sm font-medium text-stone-50 transition hover:bg-stone-700 disabled:opacity-40"
          >
            {submitAnswer.isPending ? "Checking…" : "Check answer"}
          </button>
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

  return (
    <section aria-live="polite" className="space-y-4 border-t border-stone-200 pt-6">
      <p className="text-lg font-semibold">
        Score:{" "}
        <span className={percent === 100 ? "text-emerald-700" : "text-stone-900"}>{percent}%</span>
      </p>

      <ul className="space-y-3">
        {result.sentences.map((sentence) => (
          <li
            key={sentence.sentenceIndex}
            className={`rounded border p-3 ${
              sentence.correct ? "border-emerald-200 bg-emerald-50" : "border-red-200 bg-red-50"
            }`}
          >
            <p className="font-medium">
              {sentence.correct ? "✓" : "✗"} {sentence.text || <em>(no answer)</em>}
            </p>
            {sentence.errors.map((error, index) => (
              <div key={index} className="mt-2 text-sm text-stone-700">
                <p>
                  <span className="font-semibold capitalize">{error.type.replace(/_/g, " ")}:</span>{" "}
                  {error.explanation}
                </p>
                {error.correctedText && (
                  <p className="mt-0.5 text-stone-600">
                    Correct:{" "}
                    <span className="font-medium text-stone-900">{error.correctedText}</span>
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
        className="rounded bg-indigo-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-600"
      >
        {nextLabel}
      </button>
    </section>
  );
}
