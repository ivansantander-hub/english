/**
 * Port the application depends on. The domain/application layers only know
 * this interface — never OpenRouter, OpenAI, Anthropic, etc. directly.
 */
export interface LLMGenerateInput {
  system: string;
  prompt: string;
  model: string;
  /** Hint the provider to constrain output to valid JSON when supported. */
  responseFormat?: "json";
  temperature?: number;
}

export interface LLMGenerateOutput {
  text: string;
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
  };
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface LLMChatStreamInput {
  system: string;
  messages: ChatMessage[];
  model: string;
  temperature?: number;
}

export interface LLMProvider {
  generate(input: LLMGenerateInput): Promise<LLMGenerateOutput>;
  /** Yields text deltas as they arrive — used for the conversation tutor. */
  generateStream(input: LLMChatStreamInput): AsyncIterable<string>;
}

export class AIProviderError extends Error {
  constructor(
    message: string,
    override readonly cause?: unknown,
  ) {
    super(message);
    this.name = "AIProviderError";
  }
}

export class AIResponseValidationError extends Error {
  constructor(
    message: string,
    readonly rawResponse: string,
  ) {
    super(message);
    this.name = "AIResponseValidationError";
  }
}
