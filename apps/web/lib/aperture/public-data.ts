import "server-only";

import type {
  ApertureAgency,
  ApertureOpportunity,
  ApertureProblem,
  ApertureSignal
} from "@deeptechly/aperture";
import { publicApertureItems } from "@deeptechly/aperture";

// Phase 16 intentionally ships no synthetic government findings. Phase 17 will
// connect the evidence-backed repository/workflow to these public selectors.
const signals: ApertureSignal[] = [];
const problems: ApertureProblem[] = [];
const opportunities: ApertureOpportunity[] = [];
const agencies: ApertureAgency[] = [];

export async function listPublicSignals() {
  return publicApertureItems(signals);
}

export async function listPublicProblems() {
  return publicApertureItems(problems);
}

export async function listPublicOpportunities() {
  return publicApertureItems(opportunities);
}

export async function listPublicAgencies() {
  return agencies.filter((agency) =>
    [...signals, ...problems]
      .filter((item) => item.published && item.sources.length > 0)
      .some((item) => item.agency?.slug === agency.slug)
  );
}

export async function getPublicSignal(slug: string) {
  return (await listPublicSignals()).find((item) => item.slug === slug) ?? null;
}

export async function getPublicProblem(slug: string) {
  return (await listPublicProblems()).find((item) => item.slug === slug) ?? null;
}

export async function getPublicOpportunity(slug: string) {
  return (await listPublicOpportunities()).find((item) => item.slug === slug) ?? null;
}

export async function getPublicAgency(slug: string) {
  return (await listPublicAgencies()).find((item) => item.slug === slug) ?? null;
}
