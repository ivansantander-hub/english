import { z } from "zod";

/**
 * .env files commonly leave optional vars present-but-blank (`FOO=""`)
 * rather than omitted entirely. Treat that the same as "unset" so `??`
 * fallbacks downstream (e.g. llmModelFor) work as intended.
 */
const optionalString = () =>
  z
    .string()
    .optional()
    .transform((value) => (value === "" ? undefined : value));

const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  APP_URL: z.string().url().default("http://localhost:5173"),
  API_PORT: z.coerce.number().int().positive().default(4000),

  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),

  OPENROUTER_API_KEY: optionalString(),
  OPENROUTER_BASE_URL: z.string().url().default("https://openrouter.ai/api/v1"),

  LLM_MODEL: z.string().min(1).default("openai/gpt-4o-mini"),
  EVALUATION_MODEL: optionalString(),
  GENERATION_MODEL: optionalString(),
  CONVERSATION_MODEL: optionalString(),
});

export type Env = z.infer<typeof EnvSchema>;

function loadEnv(): Env {
  const parsed = EnvSchema.safeParse(process.env);
  if (!parsed.success) {
    console.error("Invalid environment configuration:");
    console.error(parsed.error.flatten().fieldErrors);
    throw new Error("Missing or invalid environment variables — see above.");
  }
  return parsed.data;
}

/**
 * The only place in the codebase allowed to read `process.env` directly.
 * Everything else imports this validated, typed object instead.
 */
export const env: Env = loadEnv();

export const llmModelFor = (capability: "evaluation" | "generation" | "conversation"): string => {
  const overrides: Record<typeof capability, string | undefined> = {
    evaluation: env.EVALUATION_MODEL,
    generation: env.GENERATION_MODEL,
    conversation: env.CONVERSATION_MODEL,
  };
  return overrides[capability] ?? env.LLM_MODEL;
};
