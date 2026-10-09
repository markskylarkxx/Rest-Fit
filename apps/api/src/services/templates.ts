import { db } from "../lib/db.js";
import { HttpError, notFound } from "../lib/errors.js";

export interface TemplateInput {
  name: string;
  exerciseIds: string[];
}

function shape(t: {
  id: string;
  name: string;
  exerciseIds: string[];
  createdAt: Date;
}) {
  return {
    id: t.id,
    name: t.name,
    exerciseIds: t.exerciseIds,
    createdAt: t.createdAt.toISOString(),
  };
}

export async function listTemplates(userId: string) {
  const rows = await db.workoutTemplate.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
  });
  return rows.map(shape);
}

export async function createTemplate(userId: string, input: TemplateInput) {
  if (!input.name.trim()) {
    throw new HttpError(400, "Template needs a name");
  }
  if (input.exerciseIds.length === 0) {
    throw new HttpError(400, "Template needs at least one exercise");
  }
  const created = await db.workoutTemplate.create({
    data: {
      userId,
      name: input.name.trim(),
      exerciseIds: input.exerciseIds,
    },
  });
  return shape(created);
}

export async function deleteTemplate(userId: string, id: string) {
  const existing = await db.workoutTemplate.findFirst({
    where: { id, userId },
  });
  if (!existing) throw notFound("Template");
  await db.workoutTemplate.delete({ where: { id } });
}