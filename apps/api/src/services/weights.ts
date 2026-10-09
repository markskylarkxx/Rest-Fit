import { db } from "../lib/db.js";
import { HttpError, notFound } from "../lib/errors.js";

export interface WeightInput {
  kg: number;
  date?: string;
}

function shape(w: {
  id: string;
  kg: number;
  date: Date;
  createdAt: Date;
}) {
  return {
    id: w.id,
    kg: w.kg,
    date: w.date.toISOString(),
    createdAt: w.createdAt.toISOString(),
  };
}

export async function listWeights(userId: string, limit = 200) {
  const rows = await db.weightEntry.findMany({
    where: { userId },
    orderBy: { date: "desc" },
    take: limit,
  });
  return rows.map(shape);
}

export async function addWeight(userId: string, input: WeightInput) {
  if (!Number.isFinite(input.kg) || input.kg <= 0 || input.kg > 500) {
    throw new HttpError(400, "Weight must be between 0 and 500 kg");
  }
  const created = await db.weightEntry.create({
    data: {
      userId,
      kg: input.kg,
      date: input.date ? new Date(input.date) : new Date(),
    },
  });
  return shape(created);
}

export async function deleteWeight(userId: string, id: string) {
  const existing = await db.weightEntry.findFirst({ where: { id, userId } });
  if (!existing) throw notFound("Weight entry");
  await db.weightEntry.delete({ where: { id } });
}