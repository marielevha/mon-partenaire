export const PROJECT_NEED_TYPES = [
  "FINANCIAL",
  "SKILL",
  "MATERIAL",
  "PARTNERSHIP",
] as const;

export type ProjectNeedType = (typeof PROJECT_NEED_TYPES)[number];

export const PROJECT_NEED_TYPE_LABELS: Record<ProjectNeedType, string> = {
  FINANCIAL: "Financier",
  SKILL: "Compétence",
  MATERIAL: "Matériel",
  PARTNERSHIP: "Partenariat",
};

export function normalizeProjectNeedType(value: string): ProjectNeedType | null {
  const normalized = value.trim().toUpperCase();
  return PROJECT_NEED_TYPES.includes(normalized as ProjectNeedType)
    ? (normalized as ProjectNeedType)
    : null;
}

export function projectNeedTypeLabel(type: string): string {
  const normalized = normalizeProjectNeedType(type);
  if (!normalized) {
    return "Autre besoin";
  }
  return PROJECT_NEED_TYPE_LABELS[normalized];
}

export function splitSkillTags(value: unknown): string[] {
  if (Array.isArray(value)) {
    return Array.from(
      new Set(
        value
          .filter((entry): entry is string => typeof entry === "string")
          .map((entry) => entry.trim())
          .filter((entry) => entry.length > 0)
      )
    ).slice(0, 20);
  }

  if (typeof value !== "string") {
    return [];
  }

  return Array.from(
    new Set(
      value
        .split(",")
        .map((entry) => entry.trim())
        .filter((entry) => entry.length > 0)
    )
  ).slice(0, 20);
}

