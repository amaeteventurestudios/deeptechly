export type EntityInputType =
  | "company"
  | "domain"
  | "patent"
  | "lab"
  | "government_program"
  | "technology"
  | "unknown";

const genericCompanySuffixes = new Set([
  "ai",
  "co",
  "company",
  "corp",
  "corporation",
  "gmbh",
  "inc",
  "incorporated",
  "industries",
  "labs",
  "limited",
  "llc",
  "ltd",
  "plc",
  "systems",
  "technologies",
  "technology"
]);

export function normalizeDomain(input?: string | null) {
  if (!input) return null;
  const trimmed = input.trim();
  if (!trimmed) return null;

  try {
    const value = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    return new URL(value).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return null;
  }
}

export function normalizeEntityName(input: string) {
  const tokens = input
    .trim()
    .replace(/^https?:\/\//i, "")
    .replace(/^www\./i, "")
    .replace(/\.[a-z]{2,}(?:\/.*)?$/i, "")
    .replace(/['’]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/gi, " ")
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);

  while (tokens.length > 1 && genericCompanySuffixes.has(tokens[tokens.length - 1])) {
    tokens.pop();
  }

  return tokens.join(" ");
}

export function classifyEntityInput(input: string): EntityInputType {
  const trimmed = input.trim();
  const lower = trimmed.toLowerCase();
  const domainCandidate = trimmed.replace(/^https?:\/\//i, "");

  if (normalizeDomain(trimmed) && /^[a-z0-9.-]+\.[a-z]{2,}(?:\/.*)?$/i.test(domainCandidate)) {
    return "domain";
  }
  if (/\b(?:us|wo|ep|jp|cn)\s?\d{4,}[a-z]?\b/i.test(trimmed) || /\bpatent\b/i.test(trimmed) || /patents\.google\.com/i.test(trimmed)) {
    return "patent";
  }
  if (
    /\b(?:darpa|nasa|doe|dod|arpa-e|nsf|nih|afwerx|space force|sbir|sttr)\b/i.test(lower) &&
    /\b(?:program|topic|award|solicitation|mission|technology|nom4d|sbir|sttr)\b/i.test(lower)
  ) {
    return "government_program";
  }
  if (/\b(?:university|institute|laboratory|lab|national lab|research center)\b/i.test(lower)) {
    return "lab";
  }
  if (/\b(?:platform|system|architecture|technology|material|process|sige|sapphire)\b/i.test(lower)) {
    return "technology";
  }
  return normalizeEntityName(trimmed) ? "company" : "unknown";
}

export function createCanonicalSlug(entityName: string, entityType?: EntityInputType | string) {
  const base = (normalizeEntityName(entityName) || entityName)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72);
  const normalizedType = String(entityType ?? "").replace(/_/g, "-");
  return base || (normalizedType ? `${normalizedType}-entity` : "entity");
}

export function entityTypeForInput(inputType: EntityInputType) {
  if (inputType === "patent") return "Patent";
  if (inputType === "lab") return "Lab";
  if (inputType === "government_program") return "Government Program";
  if (inputType === "technology") return "Technology";
  if (inputType === "domain" || inputType === "company") return "Company";
  return "Unknown";
}
