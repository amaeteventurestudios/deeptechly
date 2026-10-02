import "server-only";

export type NewsroomProvider = "compatibility" | "directus";

export type NewsroomConfiguration = {
  provider: NewsroomProvider;
  configured: boolean;
  studioUrl: string | null;
  detail: string;
};

export function selectedNewsroomProvider(value = process.env.DEEPTECHLY_NEWSROOM_PROVIDER) {
  const provider = value?.trim().toLowerCase() || "compatibility";
  if (provider === "compatibility" || provider === "directus") return provider;
  throw new Error(`Unsupported newsroom provider: ${provider}`);
}

export function getNewsroomConfiguration(
  environment: NodeJS.ProcessEnv = process.env
): NewsroomConfiguration {
  const provider = selectedNewsroomProvider(environment.DEEPTECHLY_NEWSROOM_PROVIDER);
  if (provider === "compatibility") {
    return {
      provider,
      configured: true,
      studioUrl: null,
      detail: "DeepTechly review console with compatibility persistence"
    };
  }

  const baseUrl = validatedHttpUrl(environment.DIRECTUS_BASE_URL);
  const studioUrl = validatedHttpUrl(environment.DIRECTUS_STUDIO_URL) ?? baseUrl;
  const configured = Boolean(baseUrl && environment.DIRECTUS_TOKEN?.trim());

  return {
    provider,
    configured,
    studioUrl,
    detail: configured
      ? "Directus commodity CRUD with DeepTechly review policy"
      : "Directus selected but its server URL or server token is missing"
  };
}

function validatedHttpUrl(value: string | undefined) {
  if (!value?.trim()) return null;
  try {
    const url = new URL(value);
    return /^https?:$/.test(url.protocol) ? url.toString().replace(/\/$/, "") : null;
  } catch {
    return null;
  }
}
