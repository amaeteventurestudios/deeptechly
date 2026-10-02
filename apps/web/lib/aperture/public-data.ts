import "server-only";

import type {
  ApertureAgency,
  ApertureOpportunity,
  ApertureProblem,
  ApertureSignal
} from "@deeptechly/aperture";
import { publicApertureItems } from "@deeptechly/aperture";
import {
  curatedApertureAgencies,
  curatedApertureEvidencePacks,
  curatedApertureOpportunities,
  curatedApertureProblems,
  curatedApertureSignals
} from "./curated-publications";

const signals: ApertureSignal[] = curatedApertureSignals;
const problems: ApertureProblem[] = curatedApertureProblems;
const opportunities: ApertureOpportunity[] = curatedApertureOpportunities;
const agencies: ApertureAgency[] = curatedApertureAgencies;
const evidencePacks = curatedApertureEvidencePacks;

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

export async function listPublicEvidencePacks() {
  return evidencePacks.filter((pack) => pack.published && pack.sources.length > 0);
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
