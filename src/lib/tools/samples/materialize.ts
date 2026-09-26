import { readFile } from "node:fs/promises";
import { join, normalize } from "node:path";
import { putFile } from "@/lib/storage";
import { sniffImage, safeFileName } from "@/lib/security/files";
import { AppError } from "@/lib/errors";
import { FILE_REF_PREFIX } from "@/lib/tools/samples/test-intakes";

/**
 * Server-only: turns `@file:<path under public/>` intake values into real INPUT File rows, exactly as the
 * customer's upload route would store them, so the admin pipeline test and the test-suite exercise the same
 * code path as a paying customer (getFileBuffer → image model). Only files under public/ can be referenced.
 */
export async function materializeTestIntake(intake: Record<string, unknown>, opts: { userId?: string | null } = {}): Promise<Record<string, unknown>> {
  const out: Record<string, unknown> = { ...intake };
  for (const [key, value] of Object.entries(intake)) {
    if (typeof value !== "string" || !value.startsWith(FILE_REF_PREFIX)) continue;
    const rel = normalize(value.slice(FILE_REF_PREFIX.length)).replace(/^([./\\])+/, "");
    if (rel.includes("..")) throw new AppError(`Bad test file reference: ${value}`, 400, "bad_file_ref");
    const abs = join(process.cwd(), "public", rel);
    const data = await readFile(abs);
    const { mime, ext } = sniffImage(data);
    const row = await putFile({ kind: "INPUT", name: safeFileName(rel.split(/[\\/]/).pop() ?? `sample.${ext}`, ext), mime, data, userId: opts.userId ?? null });
    out[key] = row.id;
  }
  return out;
}
