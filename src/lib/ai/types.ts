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

export type ImageEditRequest = {
  /** Source photo (PNG/JPEG/WebP). */
  image: Buffer;
  mime: string;
  prompt: string;
  model: string;
  n: number;
  /** "auto" = keep the input's aspect ratio where the model allows it (see src/lib/ai/image-size.ts), else a fixed WIDTHxHEIGHT. */
  size: string;
  quality: "low" | "medium" | "high";
  /** Input photo dimensions (after orientation), used to compute an aspect-preserving output size. */
  inputWidth?: number;
  inputHeight?: number;
};

export type ImageEditResult = {
  /** PNG bytes, one per generated image. */
  images: Buffer[];
  model: string;
  provider: string;
  latencyMs: number;
};

export interface AiProvider {
  readonly name: string;
  complete(req: CompletionRequest): Promise<CompletionResult>;
  /** Image-to-image edit (virtual staging etc.). Optional: providers without it throw a non-retryable error. */
  editImage?(req: ImageEditRequest): Promise<ImageEditResult>;
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
