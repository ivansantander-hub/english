import { prisma } from "@english-a1/db";
import { computeAccuracy, computePriority } from "@english-a1/learning";
import type { ConceptProgress } from "@english-a1/shared";

export class ProgressService {
  async getConceptProgress(userId: string): Promise<ConceptProgress[]> {
    const concepts = await prisma.concept.findMany({
      include: {
        userProgress: { where: { userId } },
        children: { select: { id: true } },
      },
      orderBy: { name: "asc" },
    });

    // Organizational parent concepts (e.g. "prepositions") group their
    // children by grammarTopic already — showing them alongside their own
    // children would double-count the same practice under two rows.
    const leafConcepts = concepts.filter((concept) => concept.children.length === 0);

    return leafConcepts.map((concept) => {
      const progress = concept.userProgress[0];
      const attempts = progress?.attempts ?? 0;
      const correct = progress?.correct ?? 0;
      const accuracy = computeAccuracy(attempts, correct);

      return {
        conceptId: concept.id,
        conceptKey: concept.key,
        conceptName: concept.name,
        grammarTopic: concept.grammarTopic,
        attempts,
        correct,
        accuracy,
        priority: computePriority(attempts, accuracy),
        lastPracticedAt: progress?.lastPracticedAt ?? null,
      };
    });
  }

  async getExercisesCompletedCount(userId: string): Promise<number> {
    return prisma.exerciseAttempt.count({ where: { userId } });
  }
}
