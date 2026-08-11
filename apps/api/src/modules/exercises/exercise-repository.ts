import { Prisma, prisma } from "@english-a1/db";
import type { FilterableExercise } from "@english-a1/exercise";

const exerciseWithConcepts = Prisma.validator<Prisma.ExerciseDefaultArgs>()({
  include: { concepts: { include: { concept: true } } },
});
type ExerciseRow = Prisma.ExerciseGetPayload<typeof exerciseWithConcepts>;

export interface ExerciseRecord extends FilterableExercise {
  spanishText: string | null;
  expectedAnswer: string | null;
  prompt: string | null;
  contextHint: string | null;
}

export interface ExerciseRepository {
  findAll(): Promise<ExerciseRecord[]>;
  findById(id: string): Promise<ExerciseRecord | null>;
  findManyByIds(ids: string[]): Promise<ExerciseRecord[]>;
}

function toRecord(row: ExerciseRow): ExerciseRecord {
  return {
    id: row.id,
    type: row.type,
    level: row.level,
    difficulty: row.difficulty,
    grammarTopic: row.grammarTopic,
    conceptKeys: row.concepts.map((link) => link.concept.key),
    spanishText: row.spanishText,
    expectedAnswer: row.expectedAnswer,
    prompt: row.prompt,
    contextHint: row.contextHint,
  };
}

export class PrismaExerciseRepository implements ExerciseRepository {
  async findAll(): Promise<ExerciseRecord[]> {
    const rows = await prisma.exercise.findMany(exerciseWithConcepts);
    return rows.map(toRecord);
  }

  async findById(id: string): Promise<ExerciseRecord | null> {
    const row = await prisma.exercise.findUnique({ where: { id }, ...exerciseWithConcepts });
    return row ? toRecord(row) : null;
  }

  async findManyByIds(ids: string[]): Promise<ExerciseRecord[]> {
    const rows = await prisma.exercise.findMany({
      where: { id: { in: ids } },
      ...exerciseWithConcepts,
    });
    return rows.map(toRecord);
  }
}
