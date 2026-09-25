export type AiTier = "cheap" | "standard" | "best";

export type CompletionRequest = {
  system: string;
  user: string;
  model: string;
  maxOutputTokens?: number;
  temperature?: number;
  /** When set, the provider must return JSON that matches this schema (JSON Schema object). */
  jsonSchema?: { name: string; schema: Record<string, unknown> };
};

export type CompletionResult = {
  text: string;
  inputTokens: number;
  outputTokens: number;
  model: string;
  provider: string;
  latencyMs: number;
};

export interface AiProvider {
  readonly name: string;
  complete(req: CompletionRequest): Promise<CompletionResult>;
}

export class AiProviderError extends Error {
  retryable: boolean;
  status?: number;
  constructor(message: string, opts: { retryable: boolean; status?: number }) {
    super(message);
    this.retryable = opts.retryable;
    this.status = opts.status;
  }
}
