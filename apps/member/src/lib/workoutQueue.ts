import { openDB, type IDBPDatabase } from "idb";
import { api } from "./api";

const DB_NAME = "restfit_queue";
const STORE = "pending";

export interface PendingOp {
  id: string;
  type: "create-workout" | "delete-workout";
  payload: unknown;
  createdAt: number;
  attempts: number;
}

let dbPromise: Promise<IDBPDatabase> | null = null;

function db() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, 1, {
      upgrade(d) {
        if (!d.objectStoreNames.contains(STORE)) {
          d.createObjectStore(STORE, { keyPath: "id" });
        }
      },
    });
  }
  return dbPromise;
}

async function enqueue(op: PendingOp) {
  const d = await db();
  await d.put(STORE, op);
}

async function dequeue(id: string) {
  const d = await db();
  await d.delete(STORE, id);
}

export async function pendingCount(): Promise<number> {
  const d = await db();
  return d.count(STORE);
}

export async function listPending(): Promise<PendingOp[]> {
  const d = await db();
  return d.getAll(STORE);
}

async function runOp(op: PendingOp): Promise<unknown> {
  if (op.type === "create-workout") {
    const { data } = await api.post("/app/workouts", op.payload);
    return data;
  } else if (op.type === "delete-workout") {
    const { id } = op.payload as { id: string };
    try {
      await api.delete(`/app/workouts/${id}`);
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response
        ?.status;
      if (status !== 404) throw err;
    }
    return null;
  }
  return null;
}

export async function submit(
  type: PendingOp["type"],
  payload: unknown
): Promise<{ queued: boolean; response?: unknown }> {
  const op: PendingOp = {
    id: `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
    type,
    payload,
    createdAt: Date.now(),
    attempts: 0,
  };

  try {
    const response = await runOp(op);
    return { queued: false, response };
  } catch (err: unknown) {
    const status = (err as { response?: { status?: number } })?.response
      ?.status;
    if (status && status >= 400 && status < 500) {
      throw err;
    }
    await enqueue(op);
    return { queued: true };
  }
}

export async function flush() {
  const ops = await listPending();
  for (const op of ops) {
    try {
      await runOp(op);
      await dequeue(op.id);
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response
        ?.status;
      if (status && status >= 400 && status < 500) {
        await dequeue(op.id);
        continue;
      }
      break;
    }
  }
}