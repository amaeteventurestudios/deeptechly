import type { ResearchEntity, Source } from "@/lib/types";
import type {
  EntityInputType,
  EntityResolutionMetadata
} from "./entity-resolution";
import type { PublicSectorSignals } from "./public-sector-recognition";

export type ResearchMode =
  | "company"
  | "patent"
  | "lab"
  | "technology"
  | "domain"
  | "government_program"
  | "unknown";

export type ResearchStage =
  | "queued"
  | "resolving_entity"
  | "finding_official_domain"
  | "confirming_company_identity"
  | "searching_web"
  | "reading_homepage"
  | "reading_technical_pages"
  | "distilling_facts"
  | "filling_gaps"
  | "verifying_claims"
  | "mapping_technology_stack"
  | "mapping_government_relevance"
  | "estimating_readiness"
  | "drafting_outputs"
  | "publishing_article"
  | "publishing_profile"
  | "finalizing_dossier"
  | "public_research_ready"
  | "done"
  | "failed"
  | "cancelled";

export type ResearchFailureStage = ResearchStage | "pre_publish_validation";

export type PublishedStatus = "draft" | "published";

export type ResearchJob = {
  id: string;
  userId?: string | null;
  query: string;
  normalizedQuery: string;
  mode: ResearchMode;
  stage: ResearchStage;
  progress: number;
  message: string;
  detail: string;
  statusLabel:
    | "QUEUED"
    | "SEARCHING"
    | "ANALYZING"
    | "WRITING"
    | "PUBLISHING"
    | "FINALIZING"
    | "READY"
    | "DONE"
    | "FAILED"
    | "CANCELLED";
  sourceCount: number;
  resolvedDomain?: string | null;
  resolvedName?: string | null;
  resolutionStatus?: "resolved" | "limited" | null;
  entityInputType?: EntityInputType;
  requested_entity_name?: string | null;
  requested_entity_query?: string | null;
  requested_entity_type?: EntityInputType | string | null;
  normalized_requested_entity_name?: string | null;
  resolutionMetadata?: EntityResolutionMetadata;
  stageStartedAt?: string;
  publicResearchReadyAt?: string | null;
  cancellationRequested?: boolean;
  failedStage?: ResearchStage | null;
  failure_code?: string | null;
  failure_stage?: ResearchFailureStage | null;
  failure_message_internal?: string | null;
  failure_generated_entity_name?: string | null;
  failure_generated_slug?: string | null;
  failure_suspected_source_publisher?: string | null;
  error: string | null;
  articleId: string | null;
  entityId: string | null;
  dossierId: string | null;
  articleUrl: string | null;
  profileUrl: string | null;
  dossierUrl: string | null;
  orchestration?: {
    lockKey: string;
    inputFingerprint: string;
    attemptCount: number;
    maxAttempts: number;
    lastRunStartedAt?: string | null;
    lastRunFinishedAt?: string | null;
    nextRetryAt?: string | null;
    retryable?: boolean;
    failureType?: "transient" | "permanent" | "stuck" | "timeout" | null;
    stuckMarkedAt?: string | null;
  };
  feed?: {
    slug: string;
    entityName: string;
    articleTitle: string;
    articleDek: string;
    summary: string;
    sector: string;
    confidenceLabel: string;
    confidenceScore: number;
    sourceCount: number;
    heroImage: string | null;
    authorPersona?: string;
    sectorTags?: string[];
    stageTag?: string;
    regionTag?: string;
    entityTypeTag?: string;
    publishedAt: string;
  } | null;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
};

export type SearchResult = {
  title: string;
  url: string;
  snippet?: string;
  sourceType?: Source["type"];
};

export type ReadablePage = {
  url: string;
  title: string;
  description: string;
  canonicalUrl?: string | null;
  faviconUrl?: string | null;
  text: string;
  links: string[];
  images: string[];
  ogImage: string | null;
  twitterImage: string | null;
};

export type ExtractedEntityFacts = {
  name: string;
  domain?: string | null;
  website?: string | null;
  foundedYear?: string | null;
  headquarters?: string | null;
  founders?: string[];
  employeeCount?: string | null;
  fundingStage?: string | null;
  fundingAmount?: string | null;
  investors?: string[];
  sector: string;
  secondarySectors: string[];
  productSummary: string;
  customerSegments: string[];
  businessModel?: string | null;
  openRoles?: string[];
  patents?: string[];
  papers?: string[];
  governmentLinks?: string[];
  publicSector?: {
    detectedAgencies: string[];
    detectedPatentIds: string[];
    publicSectorSignals: PublicSectorSignals[];
    governmentSourceCount: number;
    patentSourceCount: number;
    publicSectorConfidence: "none" | "low" | "medium" | "high";
    publicSectorNotes: string[];
  };
  sourceUrls: string[];
  confidenceNotes: string[];
};

export type SourceSummary = {
  url: string;
  title: string;
  sourceType: Source["type"];
  sourcePublisher?: string;
  mentionedEntities?: string[];
  inferredCanonicalEntity?: string | null;
  keyFacts: string[];
  claims: string[];
  numbers: string[];
  people: string[];
  products: string[];
  dates: string[];
  uncertainty: string[];
};

export type ClaimVerification = {
  confirmed: string[];
  inferred: string[];
  unverified: string[];
};

export type StoredResearchArticle = {
  id: string;
  slug: string;
  entityId: string;
  title: string;
  dek: string;
  authorPersona: string;
  heroImage: string | null;
  heroImageUrl?: string | null;
  heroImageSourceUrl?: string | null;
  heroImageAlt?: string | null;
  imageAttribution?: string | null;
  sourceOgImageUrl?: string | null;
  entityLogoUrl?: string | null;
  faviconUrl?: string | null;
  bodySections: ResearchEntity["article"]["sections"];
  tags: string[];
  sectorTags?: string[];
  stageTag?: string;
  regionTag?: string;
  entityTypeTag?: string;
  sources: Source[];
  publishedStatus: PublishedStatus;
  adminFeatured: boolean;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type StoredDossier = {
  id: string;
  slug: string;
  entityId: string;
  dossier: ResearchEntity["dossier"];
  publishedStatus: PublishedStatus;
  createdAt: string;
  updatedAt: string;
};

export type ResearchStoreData = {
  jobs: ResearchJob[];
  entities: ResearchEntity[];
  articles: StoredResearchArticle[];
  dossiers: StoredDossier[];
  searchEvents: {
    id: string;
    jobId: string;
    query: string;
    provider: string;
    resultCount: number;
    createdAt: string;
  }[];
};

export type ResearchOutput = {
  entity: ResearchEntity;
  article: StoredResearchArticle;
  dossier: StoredDossier;
  publishable: boolean;
};
