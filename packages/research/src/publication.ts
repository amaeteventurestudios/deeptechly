import { MIN_SOURCE_COUNT_TO_PUBLISH } from "./limits";

export type PublicationCandidate = {
  sourceCount: number;
  confidenceScore: number;
  name: string;
  summary: string;
  article: { headline: string; dek?: string; sections: readonly unknown[] };
  dossier: { executiveSummary: readonly unknown[] };
};

function hasCompletePublicArtifacts(entity: PublicationCandidate) {
  return Boolean(
    entity.article.headline &&
      entity.article.sections.length >= 4 &&
      entity.name &&
      entity.summary &&
      entity.dossier.executiveSummary.length > 0 &&
      entity.confidenceScore >= 50
  );
}

export function isPublicationEligible(entity: PublicationCandidate) {
  return entity.sourceCount >= MIN_SOURCE_COUNT_TO_PUBLISH && hasCompletePublicArtifacts(entity);
}

export function isCompletedFeedEligible(entity: PublicationCandidate) {
  return Boolean(entity.article.dek && hasCompletePublicArtifacts(entity));
}
