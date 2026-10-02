export type RepositoryHealth = {
  status: "available" | "degraded" | "unavailable";
  detail?: string;
};
