export type ResearchConfidenceLabel =
  | "HIGH CONFIDENCE"
  | "MODERATE CONFIDENCE"
  | "LIMITED PUBLIC DATA"
  | "LOW CONFIDENCE";

export type EvidenceMix = {
  total: number;
  official: number;
  strongOrBetter: number;
  weak: number;
  hasReliableEvidence: boolean;
};

export function confidenceLabelForScore(score: number): ResearchConfidenceLabel {
  if (score >= 80) return "HIGH CONFIDENCE";
  if (score >= 60) return "MODERATE CONFIDENCE";
  if (score >= 35) return "LIMITED PUBLIC DATA";
  return "LOW CONFIDENCE";
}

export function calculateEvidenceConfidence(
  mix: EvidenceMix,
  claims: { confirmed: number; unverified: number }
) {
  const moderate = Math.max(0, mix.total - mix.strongOrBetter - mix.weak);
  const raw =
    18 +
    mix.official * 16 +
    (mix.strongOrBetter - mix.official) * 11 +
    moderate * 5 +
    Math.min(mix.weak, 3) * 2 +
    claims.confirmed * 3 -
    claims.unverified * 4;
  let bounded = Math.min(100, Math.max(0, raw));

  if (!mix.hasReliableEvidence) bounded = Math.min(bounded, 34);
  else if (mix.official === 0) bounded = Math.min(bounded, 59);
  else if (mix.official < 2 || mix.strongOrBetter < 3) bounded = Math.min(bounded, 79);

  return bounded;
}
