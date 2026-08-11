import { CONCEPT_SEEDS, SEED_PARAGRAPHS, SEED_SENTENCES } from "@english-a1/exercise";
import bcrypt from "bcryptjs";

import { prisma } from "../src/index.js";

const ADMIN_EMAIL = "ivansantander2020@gmail.com";
const BCRYPT_ROUNDS = 10;

function generatePin(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function seedAdmin(): Promise<void> {
  const existing = await prisma.user.findUnique({ where: { email: ADMIN_EMAIL } });
  if (existing) {
    if (existing.role !== "admin") {
      await prisma.user.update({ where: { id: existing.id }, data: { role: "admin" } });
    }
    console.log(`Admin account already exists (${ADMIN_EMAIL}) — PIN unchanged.`);
    return;
  }

  const pin = generatePin();
  const pinHash = await bcrypt.hash(pin, BCRYPT_ROUNDS);
  await prisma.user.create({
    data: { email: ADMIN_EMAIL, pinHash, role: "admin" },
  });
  console.log("=".repeat(50));
  console.log(`Admin account created: ${ADMIN_EMAIL}`);
  console.log(`Admin PIN: ${pin}`);
  console.log("Save this PIN now — it is not stored in plain text.");
  console.log("=".repeat(50));
}

async function main(): Promise<void> {
  await seedAdmin();

  console.log(`Seeding ${CONCEPT_SEEDS.length} concepts...`);
  for (const concept of CONCEPT_SEEDS) {
    await prisma.concept.upsert({
      where: { key: concept.key },
      update: { name: concept.name, grammarTopic: concept.grammarTopic },
      create: { key: concept.key, name: concept.name, grammarTopic: concept.grammarTopic },
    });
  }
  // Second pass: wire up parent relations now that every concept row exists.
  for (const concept of CONCEPT_SEEDS) {
    if (!concept.parentKey) continue;
    const parent = await prisma.concept.findUniqueOrThrow({ where: { key: concept.parentKey } });
    await prisma.concept.update({
      where: { key: concept.key },
      data: { parentId: parent.id },
    });
  }

  const allExercises = [...SEED_SENTENCES, ...SEED_PARAGRAPHS];
  console.log(`Seeding ${allExercises.length} exercises...`);
  for (const exercise of allExercises) {
    const existing = await prisma.exercise.findFirst({ where: { id: exercise.id } });
    if (existing) continue;

    const concepts = await prisma.concept.findMany({
      where: { key: { in: exercise.targetConcepts } },
    });

    await prisma.exercise.create({
      data: {
        id: exercise.id,
        type: exercise.type,
        level: exercise.level,
        difficulty: exercise.difficulty,
        grammarTopic: exercise.grammarTopic,
        spanishText: exercise.spanishText ?? null,
        expectedAnswer: exercise.expectedAnswer ?? null,
        prompt: exercise.prompt ?? null,
        contextHint: exercise.contextHint ?? null,
        source: "seeded",
        concepts: {
          create: concepts.map((concept) => ({ conceptId: concept.id })),
        },
      },
    });
  }

  console.log("Seed complete.");
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => {
    void prisma.$disconnect();
  });
