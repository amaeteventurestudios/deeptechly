import type { Source } from "@/lib/types";
import type { EntityInputType } from "./entity-resolution";
import {
  createCanonicalSlug,
  normalizeDomain,
  normalizeEntityName
} from "./entity-resolution";
import type { SourceSummary } from "./types";

export type TargetEntityAnchor = {
  requestedEntityName: string;
  requestedEntityQuery: string;
  requestedEntityType?: EntityInputType | string | null;
  normalizedRequestedEntityName: string;
};

export type EntityAnchorValidationInput = {
  requestedEntityName: string;
  generatedEntityName?: string | null;
  generatedSlug?: string | null;
  generatedHeadline?: string | null;
  sourcePublishers?: string[];
  extractedAliases?: string[];
};

export type EntityAnchorValidationResult = {
  ok: boolean;
  reason: string;
  requestedEntityName: string;
  generatedEntityName: string;
  generatedSlug: string;
  suspectedSourcePublisher?: string | null;
};

const knownSourcePublishers = new Set([
  "cb insights",
  "crunchbase",
  "linkedin",
  "nasa",
  "darpa",
  "pitchbook",
  "techcrunch",
  "wikipedia",
  "bloomberg",
  "reuters",
  "forbes",
  "businesswire",
  "pr newswire",
  "prnewswire"
]);

export const ENTITY_ANCHOR_MISMATCH_COPY =
  "We could not confidently match the generated research to the submitted entity. Try a more specific company name, domain, patent number, or source URL.";

export function buildTargetEntityAnchor(input: {
  query: string;
  requestedEntityType?: EntityInputType | string | null;
}): TargetEntityAnchor {
  const requestedEntityQuery = input.query.trim();
  const requestedEntityName = displayNameForRequestedQuery(requestedEntityQuery);

  return {
    requestedEntityName,
    requestedEntityQuery,
    requestedEntityType: input.requestedEntityType ?? null,
    normalizedRequestedEntityName: normalizeEntityName(requestedEntityName)
  };
}

export function sourcePublishersFromSummaries(
  summaries: Array<SourceSummary | Source>
) {
  return Array.from(
    new Set(
      summaries
        .flatMap((summary) => [
          "publisher" in summary ? summary.publisher : undefined,
          "sourcePublisher" in summary ? summary.sourcePublisher : undefined,
          publisherDisplayNameFromUrl(summary.url)
        ])
        .filter((value): value is string => Boolean(value?.trim()))
    )
  );
}

export function validateEntityAnchor({
  requestedEntityName,
  generatedEntityName,
  generatedSlug,
  generatedHeadline,
  sourcePublishers = [],
  extractedAliases = []
}: EntityAnchorValidationInput): EntityAnchorValidationResult {
  const requested = displayNameForRequestedQuery(requestedEntityName);
  const requestedNormalized = normalizeEntityName(requested);
  const generated = generatedEntityName?.trim() || "";
  const generatedNormalized = normalizeEntityName(generated);
  const slug = generatedSlug?.trim() || "";
  const slugNormalized = normalizeEntityName(slug.replace(/-/g, " "));
  const headlineNormalized = normalizeEntityName(generatedHeadline ?? "");
  const aliases = extractedAliases.map(normalizeEntityName).filter(Boolean);
  const publisherMatch = findPublisherMatch({
    requestedNormalized,
    generatedNormalized,
    slugNormalized,
    sourcePublishers
  });

  const closeNameMatch =
    Boolean(requestedNormalized && generatedNormalized) &&
    (requestedNormalized === generatedNormalized ||
      requestedNormalized.includes(generatedNormalized) ||
      generatedNormalized.includes(requestedNormalized) ||
      tokenSimilarity(requestedNormalized, generatedNormalized) >= 0.72);
  const aliasMatch = aliases.includes(requestedNormalized);
  const slugMatch =
    Boolean(requestedNormalized && slugNormalized) &&
    (slugNormalized === requestedNormalized ||
      slugNormalized.includes(requestedNormalized) ||
      tokenSimilarity(requestedNormalized, slugNormalized) >= 0.72);

  if (publisherMatch && !publisherMatchesRequested(publisherMatch, requestedNormalized)) {
    return {
      ok: false,
      reason: "generated output is anchored to a source publisher",
      requestedEntityName: requested,
      generatedEntityName: generated,
      generatedSlug: slug,
      suspectedSourcePublisher: publisherMatch
    };
  }

  if (closeNameMatch || aliasMatch) {
    if (slug && !slugMatch && slugLooksLikePublisher(slugNormalized, sourcePublishers)) {
      return {
        ok: false,
        reason: "generated slug is based on a source publisher",
        requestedEntityName: requested,
        generatedEntityName: generated,
        generatedSlug: slug,
        suspectedSourcePublisher: publisherFromNormalized(slugNormalized, sourcePublishers)
      };
    }
    return {
      ok: true,
      reason: aliasMatch ? "confirmed alias/legal-name match" : "generated entity matches requested entity",
      requestedEntityName: requested,
      generatedEntityName: generated,
      generatedSlug: slug,
      suspectedSourcePublisher: null
    };
  }

  if (slugMatch && !headlineCentersDifferentEntity(headlineNormalized, requestedNormalized, sourcePublishers)) {
    return {
      ok: true,
      reason: "generated slug remains anchored to requested entity",
      requestedEntityName: requested,
      generatedEntityName: generated,
      generatedSlug: slug,
      suspectedSourcePublisher: null
    };
  }

  return {
    ok: false,
    reason: "generated entity has low similarity to requested entity",
    requestedEntityName: requested,
    generatedEntityName: generated,
    generatedSlug: slug,
    suspectedSourcePublisher: publisherFromNormalized(generatedNormalized, sourcePublishers)
  };
}

export function canonicalSlugForRequestedEntity(anchor: TargetEntityAnchor) {
  return createCanonicalSlug(anchor.requestedEntityName, anchor.requestedEntityType ?? undefined);
}

function displayNameForRequestedQuery(query: string) {
  const domain = normalizeDomain(query);
  if (domain && query.trim().match(/^https?:\/\//i)) return domain;
  return query.trim().replace(/^https?:\/\//i, "").replace(/\/$/, "");
}

function publisherDisplayNameFromUrl(url: string) {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    const label = host.split(".")[0]?.replace(/[-_]+/g, " ").trim();
    return label || host;
  } catch {
    return null;
  }
}

function tokenSimilarity(a: string, b: string) {
  const aTokens = new Set(a.split(/\s+/).filter(Boolean));
  const bTokens = new Set(b.split(/\s+/).filter(Boolean));
  if (!aTokens.size || !bTokens.size) return 0;
  const overlap = [...aTokens].filter((token) => bTokens.has(token)).length;
  return overlap / Math.max(aTokens.size, bTokens.size);
}

function normalizedPublishers(sourcePublishers: string[]) {
  return sourcePublishers.map(normalizeEntityName).filter(Boolean);
}

function findPublisherMatch(input: {
  requestedNormalized: string;
  generatedNormalized: string;
  slugNormalized: string;
  sourcePublishers: string[];
}) {
  const publishers = normalizedPublishers(input.sourcePublishers);
  return publishers.find((publisher) => {
    if (!publisher) return false;
    const generatedAlreadyAnchored =
      input.generatedNormalized.includes(input.requestedNormalized) ||
      input.slugNormalized.includes(input.requestedNormalized);
    const generatedMatches =
      input.generatedNormalized === publisher ||
      input.slugNormalized === publisher ||
      (!generatedAlreadyAnchored &&
        (input.generatedNormalized.includes(publisher) ||
          input.slugNormalized.includes(publisher)));
    const knownPublisher = knownSourcePublishers.has(publisher);
    return generatedMatches || (knownPublisher && input.generatedNormalized === publisher);
  });
}

function publisherMatchesRequested(publisher: string, requestedNormalized: string) {
  return (
    publisher === requestedNormalized ||
    (publisher.includes(requestedNormalized) && requestedNormalized.length >= 6)
  );
}

function slugLooksLikePublisher(slugNormalized: string, sourcePublishers: string[]) {
  return Boolean(publisherFromNormalized(slugNormalized, sourcePublishers));
}

function publisherFromNormalized(value: string, sourcePublishers: string[]) {
  const publishers = normalizedPublishers(sourcePublishers);
  return publishers.find(
    (publisher) =>
      publisher &&
      (value === publisher || value.includes(publisher) || publisher.includes(value))
  );
}

function headlineCentersDifferentEntity(
  headlineNormalized: string,
  requestedNormalized: string,
  sourcePublishers: string[]
) {
  if (!headlineNormalized) return false;
  if (headlineNormalized.includes(requestedNormalized)) return false;
  return slugLooksLikePublisher(headlineNormalized, sourcePublishers);
}
