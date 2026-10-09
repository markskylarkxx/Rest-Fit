import { api } from "./api";

export interface WeightEntry {
  id: string;
  kg: number;
  date: string;
  createdAt: string;
}

export async function listWeights(): Promise<WeightEntry[]> {
  const { data } = await api.get<WeightEntry[]>("/app/weights");
  return data;
}

export async function addWeight(
  kg: number,
  date?: string
): Promise<WeightEntry> {
  const { data } = await api.post<WeightEntry>("/app/weights", { kg, date });
  return data;
}

export async function deleteWeight(id: string): Promise<void> {
  await api.delete(`/app/weights/${id}`);
}