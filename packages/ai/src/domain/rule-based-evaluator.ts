import { splitIntoSentences } from "@english-a1/exercise";
import type { EvaluationResult, SentenceResult } from "@english-a1/shared";

function normalize(sentence: string): string {
  return sentence
    .toLowerCase()
    .replace(/[.,!?¿¡]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Exact-match fallback evaluator used when no AI provider is configured, or
 * when the AI call fails and we still need to give the learner a result.
 * It cannot classify *why* a sentence is wrong (no grammar understanding),
 * so it only ever reports a generic "grammar" error — real classification
 * requires the AI evaluator (see packages/ai services once Phase 4 lands).
 */
export function evaluateWithRules(rawAnswer: string, expectedAnswer: string): EvaluationResult {
  const userSentences = splitIntoSentences(rawAnswer);
  const expectedSentences = splitIntoSentences(expectedAnswer);
  const sentenceCount = Math.max(userSentences.length, expectedSentences.length, 1);

  const sentences: SentenceResult[] = [];
  for (let index = 0; index < sentenceCount; index += 1) {
    const userSentence = userSentences[index] ?? "";
    const expectedSentence = expectedSentences[index] ?? "";
    const correct =
      userSentence.length > 0 && normalize(userSentence) === normalize(expectedSentence);

    sentences.push({
      sentenceIndex: index,
      text: userSentence,
      correct,
      score: correct ? 1 : 0,
      errors: correct
        ? []
        : [
            {
              type: "grammar" as const,
              category: "unverified",
              explanation:
                userSentence.length === 0
                  ? "No answer was given for this sentence."
                  : "This doesn't match the expected sentence. Rule-based fallback grading cannot explain why — an AI evaluation is needed for details.",
              explanationEs:
                userSentence.length === 0
                  ? "No se dio una respuesta para esta oración."
                  : "Esto no coincide con la oración esperada. La corrección automática de respaldo no puede explicar por qué — se necesita una evaluación con IA para más detalles.",
              ...(expectedSentence.length > 0 ? { correctedText: expectedSentence } : {}),
            },
          ],
    });
  }

  const overallScore =
    sentences.reduce((sum, sentence) => sum + sentence.score, 0) / sentences.length;

  return { overallScore, sentences };
}
