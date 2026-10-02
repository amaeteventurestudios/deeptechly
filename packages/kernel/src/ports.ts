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
