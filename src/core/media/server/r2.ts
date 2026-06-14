import "server-only";
import { DeleteObjectCommand, GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { env } from "@core/env";

/**
 * R2 (S3-compatible) client for the media upload pipeline (kernel — `core/media`,
 * ADR 0018). Server-only; never imported by public render code. The bucket is
 * EU-jurisdiction per ADR 0015. Configuration comes from the existing `R2_*` env
 * vars; if any is missing the client throws a clear, actionable error rather than
 * failing deep inside the SDK.
 */
function requireR2() {
  const { R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET } = env;
  if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET) {
    throw new Error(
      "R2 is not configured: set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET.",
    );
  }
  return { R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET };
}

let _client: S3Client | null = null;

/** Lazily-built, memoised S3 client pointed at the R2 account endpoint. */
export function r2Client(): S3Client {
  if (_client) return _client;
  const c = requireR2();
  _client = new S3Client({
    region: "auto",
    endpoint: `https://${c.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId: c.R2_ACCESS_KEY_ID, secretAccessKey: c.R2_SECRET_ACCESS_KEY },
  });
  return _client;
}

/** The configured bucket name (throws if R2 is unconfigured). */
export function r2Bucket(): string {
  return requireR2().R2_BUCKET;
}

/** Read a stored object's full bytes (used to compute image metadata on finalize). */
export async function r2GetBytes(key: string): Promise<Buffer> {
  const res = await r2Client().send(new GetObjectCommand({ Bucket: r2Bucket(), Key: key }));
  if (!res.Body) throw new Error(`R2 object has no body: ${key}`);
  const bytes = await res.Body.transformToByteArray();
  return Buffer.from(bytes);
}

/** Delete a stored object (idempotent on R2's side). */
export async function r2Delete(key: string): Promise<void> {
  await r2Client().send(new DeleteObjectCommand({ Bucket: r2Bucket(), Key: key }));
}
