export type ExternalIdentity = {
  provider: string;
  providerUserId: string;
  email: string | null;
};

export type ResearchDispatchInput = {
  jobId: string;
  query: string;
  idempotencyKey: string;
};

export interface IdentityProvider {
  getCurrentIdentity(): Promise<ExternalIdentity | null>;
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
