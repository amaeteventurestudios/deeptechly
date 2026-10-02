export type ExternalIdentity = {
  provider: string;
  providerUserId: string;
  email: string | null;
  displayName?: string | null;
  emailVerified?: boolean;
};

export type IdentityFailureReason =
  | "configuration"
  | "invalid_credentials"
  | "duplicate_identity"
  | "provider_unavailable"
  | "request_failed";

export type IdentityMutationResult =
  | { ok: true; identity?: ExternalIdentity; hasSession?: boolean }
  | { ok: false; reason: IdentityFailureReason };

export type IdentityRegistration = {
  email: string;
  password: string;
  emailRedirectTo: string;
  metadata?: Record<string, string | boolean | undefined>;
};

export type ResearchDispatchInput = {
  jobId: string;
  query: string;
  idempotencyKey: string;
};

export interface IdentityProvider {
  getCurrentIdentity(): Promise<ExternalIdentity | null>;
  signIn(email: string, password: string): Promise<IdentityMutationResult>;
  register(input: IdentityRegistration): Promise<IdentityMutationResult>;
  signOut(): Promise<IdentityMutationResult>;
  requestPasswordReset(email: string, redirectTo: string): Promise<IdentityMutationResult>;
}

export interface WorkflowDispatcher {
  dispatchResearch(input: ResearchDispatchInput): Promise<{ runId: string }>;
  cancelResearch(runId: string): Promise<void>;
}

export interface SearchProvider<Result = unknown> {
  search(query: string): Promise<Result[]>;
}

export interface ContentAcquirer<Document = unknown> {
  acquire(url: string): Promise<Document>;
}

export interface ModelGateway<Input = unknown, Output = unknown> {
  generate(input: Input): Promise<Output>;
}

export type CapabilityHealth = {
  status: "available" | "degraded" | "unavailable" | "unconfigured";
  provider: string;
  detail?: string;
  checkedAt: string;
};

export interface HealthCheck {
  health(): Promise<CapabilityHealth>;
}

export type AcquiredDocument = {
  url: string;
  canonicalUrl?: string | null;
  title?: string | null;
  markdown: string;
  text?: string;
  html?: string;
  links?: string[];
  metadata?: Record<string, unknown>;
};

export interface SourceAcquisitionProvider extends HealthCheck {
  acquire(url: string): Promise<AcquiredDocument>;
}

export type SearchDocument = {
  id: string;
  kind: string;
  title: string;
  slug: string;
  summary?: string;
  publishedAt?: string | null;
  [field: string]: unknown;
};

export type SearchRequest = {
  query: string;
  index: string;
  limit?: number;
  filter?: string | string[];
};

export type SearchResponse<Document extends SearchDocument = SearchDocument> = {
  hits: Document[];
  estimatedTotalHits: number;
  processingTimeMs?: number;
};

export type SearchIndexSettings = {
  searchableAttributes?: readonly string[];
  filterableAttributes?: readonly string[];
  sortableAttributes?: readonly string[];
};

export interface SearchIndex extends HealthCheck {
  search<Document extends SearchDocument>(request: SearchRequest): Promise<SearchResponse<Document>>;
  upsert(index: string, documents: readonly SearchDocument[]): Promise<{ taskId: string }>;
  remove(index: string, documentIds: readonly string[]): Promise<{ taskId: string }>;
  configure(index: string, settings: SearchIndexSettings): Promise<{ taskId: string }>;
}

export interface NewsroomRepository extends HealthCheck {
  list<Item extends Record<string, unknown>>(
    collection: string,
    query?: Readonly<Record<string, string>>
  ): Promise<Item[]>;
  read<Item extends Record<string, unknown>>(collection: string, id: string): Promise<Item | null>;
  create<Item extends Record<string, unknown>>(
    collection: string,
    item: Partial<Item>
  ): Promise<Item>;
  update<Item extends Record<string, unknown>>(
    collection: string,
    id: string,
    patch: Partial<Item>
  ): Promise<Item>;
}

export type TraceEvent = {
  id: string;
  traceId: string;
  name: string;
  startedAt: string;
  endedAt?: string;
  input?: unknown;
  output?: unknown;
  error?: string;
  metadata?: Record<string, string | number | boolean | null>;
};

export interface TraceSink extends HealthCheck {
  record(event: TraceEvent): Promise<void>;
}

export interface CacheStore extends HealthCheck {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttlSeconds?: number): Promise<void>;
  delete(key: string): Promise<void>;
}

export interface ObjectStore extends HealthCheck {
  put(key: string, body: Uint8Array, contentType: string): Promise<void>;
  get(key: string): Promise<Uint8Array | null>;
  signedReadUrl(key: string, expiresInSeconds: number): Promise<string>;
}

export type BillingCustomer = {
  accountId: string;
  email: string;
  name?: string | null;
  organization?: string | null;
};

export type UsageEvent = {
  idempotencyKey: string;
  accountId: string;
  code: string;
  quantity: number;
  occurredAt: string;
  properties?: Record<string, string | number | boolean>;
};

export interface BillingMeter extends HealthCheck {
  ensureCustomer(customer: BillingCustomer): Promise<{ externalCustomerId: string }>;
  reportUsage(event: UsageEvent): Promise<{ externalEventId: string }>;
}

export type CheckoutRequest = {
  accountId: string;
  email: string;
  priceId: string;
  successUrl: string;
  cancelUrl: string;
};

export interface PaymentCheckout extends HealthCheck {
  createSubscriptionCheckout(request: CheckoutRequest): Promise<{ sessionId: string; url: string }>;
}
