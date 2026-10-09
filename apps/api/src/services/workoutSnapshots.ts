import { db } from "../lib/db.js";
import { HttpError } from "../lib/errors.js";

// Hard cap on snapshot size. 5 MB is generous — the average power user
// generates ~200 KB per year of data. If we exceed this, something is wrong
// (or the user is doing something adversarial), so reject rather than
// silently fill the database.
const MAX_BYTES = 5 * 1024 * 1024;

export interface SnapshotPayload {
  workouts?: unknown;
  weights?: unknown;
  prs?: unknown;
  templates?: unknown;
  schemaVersion?: number;
  backedUpAt?: string;
}

function byteLength(data: unknown): number {
  return Buffer.byteLength(JSON.stringify(data), "utf8");
}

export async function saveSnapshot(userId: string, payload: SnapshotPayload) {
  const size = byteLength(payload);
  if (size > MAX_BYTES) {
    throw new HttpError(
      413,
      "Snapshot too large (max 5 MB). Contact support if this is unexpected."
    );
  }

  await db.workoutSnapshot.upsert({
    where: { userId },
    create: { userId, data: payload as object, sizeBytes: size },
    update: { data: payload as object, sizeBytes: size },
  });

  return { sizeBytes: size, savedAt: new Date().toISOString() };
}

export async function getSnapshot(userId: string) {
  const row = await db.workoutSnapshot.findUnique({ where: { userId } });
  if (!row) return null;
  return {
    data: row.data,
    sizeBytes: row.sizeBytes,
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function deleteSnapshot(userId: string) {
  await db.workoutSnapshot.deleteMany({ where: { userId } });
}