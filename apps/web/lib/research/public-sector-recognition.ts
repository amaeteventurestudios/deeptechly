import type { Source } from "@/lib/types";

type SourceLike = {
  url?: string;
  title?: string;
  snippet?: string;
  sourceType?: Source["type"];
  type?: Source["type"];
  keyFacts?: string[];
  claims?: string[];
};

export type PublicSectorSourceFamily =
  | "agency"
  | "military"
  | "patent_database"
  | "technology_transfer"
  | "sbir_sttr"
  | "government_document"
  | "university_technology_transfer"
  | "unknown";

export type PublicSectorConfidence = "none" | "low" | "medium" | "high";

export type PublicSectorSignals = {
  agencies: string[];
  patentIds: string[];
  programs: string[];
  hasPatentSource: boolean;
  hasGovernmentSource: boolean;
  hasSBIRSTTR: boolean;
  hasTechnologyTransfer: boolean;
  documentTypes: string[];
  sourceFamilies: PublicSectorSourceFamily[];
  confidence: PublicSectorConfidence;
  notes: string[];
};

const agencyPatterns: { agency: string; patterns: RegExp[] }[] = [
  { agency: "NASA", patterns: [/\bnasa\b/i, /(^|\.)nasa\.gov$/i] },
  { agency: "DARPA", patterns: [/\bdarpa\b/i, /(^|\.)darpa\.mil$/i] },
  { agency: "DOE", patterns: [/\bdoe\b/i, /\bdepartment of energy\b/i, /(^|\.)energy\.gov$/i] },
  { agency: "DoD", patterns: [/\bdod\b/i, /\bdepartment of defense\b/i, /(^|\.)defense\.gov$/i, /\.mil$/i] },
  { agency: "Air Force", patterns: [/\bair force\b/i, /\bafwerx\b/i, /(^|\.)af\.mil$/i] },
  { agency: "Space Force", patterns: [/\bspace force\b/i, /\bussf\b/i, /(^|\.)spaceforce\.mil$/i] },
  { agency: "Army", patterns: [/\barmy\b/i, /(^|\.)army\.mil$/i] },
  { agency: "Navy", patterns: [/\bnavy\b/i, /\bnaval\b/i, /(^|\.)navy\.mil$/i] },
  { agency: "DHS", patterns: [/\bdhs\b/i, /\bdepartment of homeland security\b/i, /(^|\.)dhs\.gov$/i] },
  { agency: "NSF", patterns: [/\bnsf\b/i, /\bnational science foundation\b/i, /(^|\.)nsf\.gov$/i] },
  { agency: "NIH", patterns: [/\bnih\b/i, /\bnational institutes of health\b/i, /(^|\.)nih\.gov$/i] },
  { agency: "NIST", patterns: [/\bnist\b/i, /\bnational institute of standards and technology\b/i, /(^|\.)nist\.gov$/i] },
  { agency: "NOAA", patterns: [/\bnoaa\b/i, /(^|\.)noaa\.gov$/i] },
  { agency: "FAA", patterns: [/\bfaa\b/i, /\bfederal aviation administration\b/i, /(^|\.)faa\.gov$/i] },
  { agency: "EPA", patterns: [/\bepa\b/i, /\benvironmental protection agency\b/i, /(^|\.)epa\.gov$/i] },
  { agency: "SBIR", patterns: [/\bsbir\b/i, /(^|\.)sbir\.gov$/i] },
  { agency: "STTR", patterns: [/\bsttr\b/i] },
  { agency: "USPTO", patterns: [/\buspto\b/i, /\bpatent and trademark office\b/i, /(^|\.)uspto\.gov$/i] }
];

const patentIdPatterns = [
  /\bUS\s?(?:Patent\s?)?(?:No\.?\s?)?\d[\d,]{5,12}(?:\s?B[12]|\s?A1)?\b/gi,
  /\bU\.S\.\s?Patent\s?(?:No\.?\s?)?\d[\d,]{5,12}(?:\s?B[12]|\s?A1)?\b/gi,
  /\bUS\d{4}\/\d{6,7}A1\b/gi,
  /\bWO\d{4}\/\d{6}\b/gi
];

function safeHost(url = "") {
  try {
    return new URL(url).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return "";
  }
}

function sourceText(source: SourceLike, extraText = "") {
  return [
    source.url,
    source.title,
    source.snippet,
    ...(source.keyFacts ?? []),
    ...(source.claims ?? []),
    extraText
  ]
    .filter(Boolean)
    .join(" ");
}

function unique(values: string[]) {
  return [...new Set(values.filter(Boolean))];
}

export function detectAgencyFromUrl(url = "") {
  const host = safeHost(url);
  if (!host) return [];

  return agencyPatterns
    .filter(({ patterns }) => patterns.some((pattern) => pattern.test(host)))
    .map(({ agency }) => agency);
}

export function detectAgencyFromText(text = "") {
  return agencyPatterns
    .filter(({ patterns }) => patterns.some((pattern) => pattern.test(text)))
    .map(({ agency }) => agency);
}

export function detectPatentIdentifier(text = "") {
  const matches = patentIdPatterns.flatMap((pattern) =>
    Array.from(text.matchAll(pattern)).map((match) =>
      match[0].replace(/,/g, "").replace(/\s+/g, " ").trim()
    )
  );
  return unique(matches).slice(0, 8);
}

export function detectProgramReference(text = "") {
  const matches = Array.from(
    text.matchAll(/\b(?:DARPA|NASA|DOE|DoD|NSF|NIH|NIST|NOAA|FAA|EPA|DHS|Air Force|Space Force|Army|Navy)\s+[A-Z][A-Za-z0-9&,\- ]{2,80}\s+(?:program|initiative|mission|project|office)\b/gi)
  ).map((match) => match[0].trim());
  return unique(matches).slice(0, 8);
}

export function detectSBIRReference(text = "") {
  return /\b(?:SBIR|STTR|Small Business Innovation Research|Small Business Technology Transfer)\b/i.test(text);
}

export function detectPatentSource(source: SourceLike) {
  const url = (source.url ?? "").toLowerCase();
  const host = safeHost(source.url);
  const text = sourceText(source).toLowerCase();

  return (
    source.sourceType === "patent" ||
    source.type === "patent" ||
    host === "patents.google.com" ||
    host.endsWith("uspto.gov") ||
    host === "patents.justia.com" ||
    host.endsWith("lens.org") ||
    url.includes("/patent/") ||
    url.includes("patentcenter") ||
    url.includes("patentscope") ||
    (url.includes("technology.nasa.gov") && text.includes("patent")) ||
    (/\btech(?:nology)? transfer\b/i.test(text) && /\bpatent|licens/i.test(text)) ||
    detectPatentIdentifier(text).length > 0
  );
}

export function detectGovernmentDocumentType(source: SourceLike) {
  const text = sourceText(source).toLowerCase();
  const types: string[] = [];
  if (/\.pdf(?:$|\?)/i.test(source.url ?? "") || text.includes(" pdf")) types.push("pdf");
  if (/\bprogram\b/.test(text)) types.push("program_page");
  if (/\baward\b|\bgrant\b/.test(text) && detectSBIRReference(text)) types.push("sbir_sttr_award_or_topic");
  if (/\bsolicitation\b|\bbaa\b|\brfi\b|\brfp\b|\bprocurement\b/.test(text)) types.push("procurement_style_document");
  if (/\bpatent\b|\blicens/.test(text) && /\btech(?:nology)? transfer\b/.test(text)) types.push("technology_transfer");
  return unique(types);
}

export function classifyPublicSectorSource(source: SourceLike): Source["type"] {
  const url = source.url ?? "";
  const host = safeHost(url);
  const text = sourceText(source);

  if (detectPatentSource(source)) return "patent";
  if (
    source.sourceType === "government" ||
    source.type === "government" ||
    host.endsWith(".gov") ||
    host.endsWith(".mil") ||
    detectAgencyFromUrl(url).length > 0 ||
    detectSBIRReference(text)
  ) {
    return "government";
  }
  return (source.sourceType ?? source.type ?? "unknown") as Source["type"];
}

function detectFamilies(source: SourceLike, text: string): PublicSectorSourceFamily[] {
  const host = safeHost(source.url);
  const families: PublicSectorSourceFamily[] = [];
  if (host.endsWith(".mil")) families.push("military");
  if (host.endsWith(".gov") || detectAgencyFromUrl(source.url).length) families.push("agency");
  if (/patents\.google\.com|uspto\.gov|patents\.justia\.com|lens\.org/i.test(host)) {
    families.push("patent_database");
  }
  if (detectSBIRReference(text) || host === "sbir.gov") families.push("sbir_sttr");
  if (/\btech(?:nology)? transfer\b|\blicens/i.test(text)) families.push("technology_transfer");
  if (/\b(university|edu)\b/i.test(text) && /\bpatent|licens|technology transfer\b/i.test(text)) {
    families.push("university_technology_transfer");
  }
  if (detectGovernmentDocumentType(source).length) families.push("government_document");
  return unique(families) as PublicSectorSourceFamily[];
}

export function extractPublicSectorSignals(source: SourceLike, extraText = ""): PublicSectorSignals {
  const text = sourceText(source, extraText);
  const agencies = unique([...detectAgencyFromUrl(source.url), ...detectAgencyFromText(text)]);
  const patentIds = detectPatentIdentifier(text);
  const documentTypes = detectGovernmentDocumentType(source);
  const sourceFamilies = detectFamilies(source, text);
  const hasPatentSource = detectPatentSource(source);
  const hasGovernmentSource = classifyPublicSectorSource(source) === "government";
  const hasSBIRSTTR = detectSBIRReference(text);
  const hasTechnologyTransfer = sourceFamilies.includes("technology_transfer") || sourceFamilies.includes("university_technology_transfer");
  const confidence: PublicSectorConfidence =
    hasPatentSource || hasGovernmentSource || agencies.length > 0
      ? "high"
      : hasSBIRSTTR || hasTechnologyTransfer || patentIds.length > 0
        ? "medium"
        : "none";
  const notes = [
    hasGovernmentSource ? "Government/public-sector source classification is source-backed." : "",
    hasPatentSource ? "Patent classification is source-backed or identifier-backed." : "",
    hasSBIRSTTR ? "SBIR/STTR reference detected; award status still requires explicit source evidence." : "",
    confidence === "none" ? "No deterministic public-sector source signal detected." : ""
  ].filter(Boolean);

  return {
    agencies,
    patentIds,
    programs: detectProgramReference(text),
    hasPatentSource,
    hasGovernmentSource,
    hasSBIRSTTR,
    hasTechnologyTransfer,
    documentTypes,
    sourceFamilies: sourceFamilies.length ? sourceFamilies : ["unknown"],
    confidence,
    notes
  };
}

export function mapPublicSectorSignalsToClaims(signals: PublicSectorSignals) {
  const claims = new Set<string>();
  if (signals.hasPatentSource) claims.add("patent");
  if (signals.patentIds.length) claims.add("patent_number");
  if (signals.hasTechnologyTransfer) claims.add("technology_transfer");
  if (signals.hasGovernmentSource || signals.agencies.length) claims.add("government_relevance");
  if (signals.programs.length) claims.add("agency_program");
  if (signals.hasSBIRSTTR) claims.add("sbir_sttr");
  if (signals.sourceFamilies.includes("government_document")) claims.add("public_sector_problem");
  if (signals.hasPatentSource || signals.hasGovernmentSource) claims.add("technical_capability");
  return [...claims];
}
