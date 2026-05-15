import "server-only";

import { readStore, writeStore } from "@/lib/research/store";

export type AdminContentRow = {
  jobId: string;
  entityName: string;
  slug: string | null;
  articleTitle: string | null;
  publishedStatus: "published" | "draft" | null;
  adminFeatured: boolean;
  stage: string;
  sourceCount: number;
  confidenceLabel: string | null;
  articleUrl: string | null;
  profileUrl: string | null;
  dossierUrl: string | null;
  createdAt: string;
  updatedAt: string;
};

export async function listAllContent(): Promise<AdminContentRow[]> {
  const data = await readStore();

  return data.jobs.map((job) => {
    const slug = job.feed?.slug ?? null;
    const article = slug ? data.articles.find((a) => a.slug === slug) : null;
    const entity = slug ? data.entities.find((e) => e.slug === slug) : null;

    return {
      jobId: job.id,
      entityName: job.feed?.entityName ?? job.resolvedName ?? job.query,
      slug,
      articleTitle: job.feed?.articleTitle ?? article?.title ?? null,
      publishedStatus: article?.publishedStatus ?? entity?.publishedStatus ?? null,
      adminFeatured: article?.adminFeatured ?? false,
      stage: job.stage,
      sourceCount: job.sourceCount,
      confidenceLabel: job.feed?.confidenceLabel ?? null,
      articleUrl: job.articleUrl,
      profileUrl: job.profileUrl,
      dossierUrl: job.dossierUrl,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt
    };
  });
}

export async function publishContent(slug: string) {
  const data = await readStore();
  const now = new Date().toISOString();
  let changed = false;

  const entityIndex = data.entities.findIndex((e) => e.slug === slug);
  if (entityIndex >= 0) {
    data.entities[entityIndex] = {
      ...data.entities[entityIndex],
      publishedStatus: "published",
      updatedAt: now
    };
    changed = true;
  }

  const articleIndex = data.articles.findIndex((a) => a.slug === slug);
  if (articleIndex >= 0) {
    data.articles[articleIndex] = {
      ...data.articles[articleIndex],
      publishedStatus: "published",
      publishedAt: data.articles[articleIndex].publishedAt ?? now,
      updatedAt: now
    };
    changed = true;
  }

  const dossierIndex = data.dossiers.findIndex((d) => d.slug === slug);
  if (dossierIndex >= 0) {
    data.dossiers[dossierIndex] = {
      ...data.dossiers[dossierIndex],
      publishedStatus: "published",
      updatedAt: now
    };
    changed = true;
  }

  if (!changed) {
    return { ok: false as const, reason: "not_found" };
  }

  await writeStore(data);
  return { ok: true as const };
}

export async function unpublishContent(slug: string) {
  const data = await readStore();
  const now = new Date().toISOString();
  let changed = false;

  const entityIndex = data.entities.findIndex((e) => e.slug === slug);
  if (entityIndex >= 0) {
    data.entities[entityIndex] = {
      ...data.entities[entityIndex],
      publishedStatus: "draft",
      updatedAt: now
    };
    changed = true;
  }

  const articleIndex = data.articles.findIndex((a) => a.slug === slug);
  if (articleIndex >= 0) {
    data.articles[articleIndex] = {
      ...data.articles[articleIndex],
      publishedStatus: "draft",
      publishedAt: null,
      updatedAt: now
    };
    changed = true;
  }

  const dossierIndex = data.dossiers.findIndex((d) => d.slug === slug);
  if (dossierIndex >= 0) {
    data.dossiers[dossierIndex] = {
      ...data.dossiers[dossierIndex],
      publishedStatus: "draft",
      updatedAt: now
    };
    changed = true;
  }

  if (!changed) {
    return { ok: false as const, reason: "not_found" };
  }

  await writeStore(data);
  return { ok: true as const };
}

export async function toggleArticleFeatured(slug: string, featured: boolean) {
  const data = await readStore();
  const now = new Date().toISOString();

  const articleIndex = data.articles.findIndex((a) => a.slug === slug);
  if (articleIndex < 0) {
    return { ok: false as const, reason: "not_found" };
  }

  data.articles[articleIndex] = {
    ...data.articles[articleIndex],
    adminFeatured: featured,
    updatedAt: now
  };

  await writeStore(data);
  return { ok: true as const };
}
