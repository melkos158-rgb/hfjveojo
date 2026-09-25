import { prisma } from "@/lib/db";
import { env, appUrl } from "@/lib/env";
import { sha256, signPayload, verifyPayload } from "@/lib/security/tokens";
import type { File as FileRow, FileKind } from "@prisma/client";

/**
 * Storage abstraction.
 *  - "db": bytes live in Postgres (persistent on Railway, fine for PDFs/images ≤ a few MB).
 *  - "s3": Cloudflare R2 / AWS S3 / MinIO via the S3 API (set STORAGE_BACKEND=s3 + S3_* vars).
 * Callers never touch the backend directly; they get File rows and signed download URLs.
 */

export type PutFileInput = {
  orderId?: string | null;
  userId?: string | null;
  kind: FileKind;
  name: string;
  mime: string;
  data: Buffer;
  expiresInDays?: number;
};

async function s3Client() {
  const { S3Client } = await import("@aws-sdk/client-s3");
  const e = env();
  return new S3Client({
    region: e.S3_REGION || "auto",
    endpoint: e.S3_ENDPOINT || undefined,
    forcePathStyle: !!e.S3_ENDPOINT,
    credentials: { accessKeyId: e.S3_ACCESS_KEY_ID, secretAccessKey: e.S3_SECRET_ACCESS_KEY },
  });
}

export async function putFile(input: PutFileInput): Promise<FileRow> {
  const e = env();
  const retentionDays =
    input.expiresInDays ?? (input.kind === "OUTPUT" ? e.FILE_RETENTION_DAYS_OUTPUT : e.FILE_RETENTION_DAYS_INPUT);
  const expiresAt = new Date(Date.now() + retentionDays * 24 * 3600 * 1000);
  const digest = sha256(input.data);

  if (e.STORAGE_BACKEND === "s3") {
    const { PutObjectCommand } = await import("@aws-sdk/client-s3");
    const client = await s3Client();
    const key = `${input.kind.toLowerCase()}/${input.orderId ?? "misc"}/${Date.now()}-${input.name}`;
    await client.send(
      new PutObjectCommand({ Bucket: e.S3_BUCKET, Key: key, Body: input.data, ContentType: input.mime }),
    );
    return prisma.file.create({
      data: {
        orderId: input.orderId ?? undefined,
        userId: input.userId ?? undefined,
        kind: input.kind,
        name: input.name,
        mime: input.mime,
        sizeBytes: input.data.length,
        sha256: digest,
        storage: "S3",
        key,
        expiresAt,
      },
    });
  }

  return prisma.file.create({
    data: {
      orderId: input.orderId ?? undefined,
      userId: input.userId ?? undefined,
      kind: input.kind,
      name: input.name,
      mime: input.mime,
      sizeBytes: input.data.length,
      sha256: digest,
      storage: "DB",
      data: new Uint8Array(input.data.buffer, input.data.byteOffset, input.data.byteLength) as Uint8Array<ArrayBuffer>,
      expiresAt,
    },
  });
}

export async function getFileBuffer(fileId: string): Promise<{ file: FileRow; data: Buffer } | null> {
  const file = await prisma.file.findUnique({ where: { id: fileId } });
  if (!file) return null;
  if (file.storage === "DB") {
    return { file, data: Buffer.from(file.data ?? new Uint8Array()) };
  }
  const { GetObjectCommand } = await import("@aws-sdk/client-s3");
  const client = await s3Client();
  const res = await client.send(new GetObjectCommand({ Bucket: env().S3_BUCKET, Key: file.key ?? "" }));
  const bytes = await res.Body?.transformToByteArray();
  return { file, data: Buffer.from(bytes ?? new Uint8Array()) };
}

/** Time-limited download URL served by /api/files/[id]?t=... (works for both backends). */
export function signedFileUrl(fileId: string, ttlSeconds = 7 * 24 * 3600): string {
  const t = signPayload({ f: fileId }, ttlSeconds);
  return appUrl(`/api/files/${fileId}?t=${encodeURIComponent(t)}`);
}

export function verifyFileToken(fileId: string, token: string): boolean {
  const p = verifyPayload<{ f: string }>(token);
  return !!p && p.f === fileId;
}

/** Delete expired files (worker maintenance). */
export async function purgeExpiredFiles(): Promise<number> {
  const expired = await prisma.file.findMany({
    where: { expiresAt: { lt: new Date() } },
    select: { id: true, storage: true, key: true },
    take: 200,
  });
  if (expired.length === 0) return 0;
  const s3Keys = expired.filter((f) => f.storage === "S3" && f.key).map((f) => f.key as string);
  if (s3Keys.length > 0) {
    const { DeleteObjectCommand } = await import("@aws-sdk/client-s3");
    const client = await s3Client();
    for (const key of s3Keys) {
      await client.send(new DeleteObjectCommand({ Bucket: env().S3_BUCKET, Key: key }));
    }
  }
  await prisma.generatedOutput.updateMany({
    where: { fileId: { in: expired.map((f) => f.id) } },
    data: { fileId: null },
  });
  const res = await prisma.file.deleteMany({ where: { id: { in: expired.map((f) => f.id) } } });
  return res.count;
}
