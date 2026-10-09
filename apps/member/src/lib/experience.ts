import { api } from "./api";

export type ExperienceLevel = "BEGINNER" | "INTERMEDIATE" | "EXPERIENCED";

const KEY = "restfit_experience";

export function getCachedExperience(): ExperienceLevel | null {
  try {
    const v = localStorage.getItem(KEY);
    if (v === "BEGINNER" || v === "INTERMEDIATE" || v === "EXPERIENCED") {
      return v;
    }
    return null;
  } catch {
    return null;
  }
}

function cache(level: ExperienceLevel) {
  try {
    localStorage.setItem(KEY, level);
  } catch {
    /* ignore */
  }
}

export async function fetchExperience(): Promise<ExperienceLevel | null> {
  try {
    const { data } = await api.get<{ experienceLevel: ExperienceLevel }>(
      "/app/me/experience"
    );
    cache(data.experienceLevel);
    return data.experienceLevel;
  } catch {
    return getCachedExperience();
  }
}

export async function setExperience(level: ExperienceLevel): Promise<void> {
  cache(level);
  await api.put("/app/me/experience", { level });
}