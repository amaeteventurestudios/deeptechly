import type { SearchDocument } from "@deeptechly/kernel";

export const discoveryKinds = [
  "article",
  "entity",
  "patent",
  "lab",
  "technology",
  "signal",
  "problem",
  "opportunity"
] as const;

export type DiscoveryKind = (typeof discoveryKinds)[number];

export type DiscoveryDocument = SearchDocument & {
  kind: DiscoveryKind;
  href: string;
  summary: string;
  entityName?: string;
  sector?: string;
  confidenceLabel?: string;
  sourceCount?: number;
  external?: boolean;
  published: true;
};

export function isDiscoveryKind(value: string): value is DiscoveryKind {
  return discoveryKinds.includes(value as DiscoveryKind);
}
