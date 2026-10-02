import { createHash } from "node:crypto";
import postgres, { type TransactionSql } from "postgres";
import type { ResearchEntity, Source } from "@/lib/types";
import { getPostgres, hasPostgresConfiguration, requirePostgres } from "@/lib/database/postgres";
import { articleMarkdown, dossierMarkdown, startupMarkdown } from "./markdown";
import type {
  ResearchJob,
  ResearchStoreData,
  StoredDossier,
  StoredResearchArticle
} from "./types";

export function isV2PostgresStoreSelected() {
  return hasPostgresConfiguration();
}

export async function readV2PostgresStore(
  connectionUrl = process.env.DEEPTECHLY_V2_DATABASE_URL?.trim()
): Promise<ResearchStoreData> {
  const sql = connectionUrl && !hasPostgresConfiguration()
    ? createOneOffConnection(connectionUrl)
    : requirePostgres();
  const closeWhenDone = Boolean(connectionUrl && !hasPostgresConfiguration());

  try {
    const [jobs, entities, articles, dossiers, searchEvents] = await Promise.all([
      sql<{ data: string }[]>`
        select compatibility_snapshot ->> 'data' as data
        from deeptechly.research_jobs order by updated_at desc
      `,
      sql<{ data: string }[]>`
        select compatibility_snapshot ->> 'data' as data
        from deeptechly.entities order by updated_at desc
      `,
      sql<{ data: string }[]>`
        select compatibility_snapshot ->> 'data' as data
        from deeptechly.articles order by updated_at desc
      `,
      sql<{ data: string }[]>`
        select compatibility_snapshot ->> 'data' as data
        from deeptechly.dossiers order by updated_at desc
      `,
      sql<{
        id: string;
        jobId: string;
        query: string;
        provider: string;
        resultCount: number;
        createdAt: Date | string;
      }[]>`
        select id, legacy_job_id as "jobId", query, provider,
          result_count as "resultCount", created_at as "createdAt"
        from deeptechly.search_events order by created_at desc
      `
    ]);

    return {
      jobs: parseRows<ResearchJob>(jobs, "research_jobs"),
      entities: parseRows<ResearchEntity>(entities, "entities"),
      articles: parseRows<StoredResearchArticle>(articles, "articles"),
      dossiers: parseRows<StoredDossier>(dossiers, "dossiers"),
      searchEvents: searchEvents.map((event) => ({
        ...event,
        createdAt: new Date(event.createdAt).toISOString()
      }))
    };
  } finally {
    if (closeWhenDone) await sql.end({ timeout: 2 });
  }
}

export async function writeV2PostgresStore(data: ResearchStoreData) {
  const sql = requirePostgres();
  await sql.begin(async (transaction) => {
    await transaction`select pg_advisory_xact_lock(hashtext('deeptechly:research-store'))`;

    const entityIds = new Map<string, string>();
    for (const entity of data.entities) {
      const existingEntities = await transaction<{ id: string }[]>`
        select id from deeptechly.entities where slug = ${entity.slug} limit 1
      `;
      const entityId = existingEntities[0]?.id || entity.id || `entity:${entity.slug}`;
      entityIds.set(entity.slug, entityId);
      entityIds.set(entityId, entityId);
      if (entity.id) entityIds.set(entity.id, entityId);
      await transaction`
        insert into deeptechly.entities (
          id, slug, name, entity_type, sector, region, stage, summary,
          official_domain, resolution_status, confidence_label, confidence_score,
          compatibility_snapshot, created_at, updated_at
        ) values (
          ${entityId}, ${entity.slug}, ${entity.name}, ${entity.entityType},
          ${entity.sector || null}, ${entity.region || null}, ${entity.stage || null},
          ${entity.summary || null}, ${entity.domain || entity.website || null},
          ${entity.resolutionMetadata?.resolutionConfidence || null},
          ${databaseConfidenceLabel(entity.confidenceLabel)},
          ${normalizeConfidence(entity.confidenceScore)},
          ${transaction.json({ data: { ...entity, id: entityId } })},
          ${entity.createdAt || entity.lastResearchedAt},
          ${entity.updatedAt || entity.lastResearchedAt}
        ) on conflict (slug) do update set
          name = excluded.name, entity_type = excluded.entity_type,
          sector = excluded.sector, region = excluded.region, stage = excluded.stage,
          summary = excluded.summary, official_domain = excluded.official_domain,
          resolution_status = excluded.resolution_status,
          confidence_label = excluded.confidence_label,
          confidence_score = excluded.confidence_score,
          compatibility_snapshot = excluded.compatibility_snapshot,
          updated_at = excluded.updated_at
      `;
      await persistEntityKnowledge(transaction, entityId, entity);
      await transaction`
        insert into deeptechly.profiles (
          id, entity_id, slug, public_markdown, structured_content,
          compatibility_snapshot, created_at, updated_at
        ) values (
          ${`profile:${entityId}`}, ${entityId}, ${entity.slug}, ${startupMarkdown(entity)},
          ${transaction.json(entity)}, ${transaction.json({ data: entity })},
          ${entity.createdAt || entity.lastResearchedAt},
          ${entity.updatedAt || entity.lastResearchedAt}
        ) on conflict (id) do update set
          slug = excluded.slug, public_markdown = excluded.public_markdown,
          structured_content = excluded.structured_content,
          compatibility_snapshot = excluded.compatibility_snapshot,
          updated_at = excluded.updated_at
      `;
      await persistPublication(
        transaction,
        "profile",
        `profile:${entityId}`,
        entity.publishedStatus === "draft" ? "draft" : "published",
        entity.updatedAt || entity.lastResearchedAt
      );
    }

    for (const article of data.articles) {
      const entityId = entityIds.get(article.entityId) ?? entityIds.get(article.slug) ?? null;
      const entity = data.entities.find((candidate) =>
        candidate.slug === article.slug || entityIds.get(candidate.slug) === entityId
      );
      const existingArticles = await transaction<{ id: string }[]>`
        select id from deeptechly.articles where slug = ${article.slug} limit 1
      `;
      const articleId = existingArticles[0]?.id || article.id;
      await transaction`
        insert into deeptechly.articles (
          id, entity_id, slug, title, dek, body_markdown, structured_body,
          author_name, compatibility_snapshot, created_at, updated_at
        ) values (
          ${articleId}, ${entityId}, ${article.slug}, ${article.title}, ${article.dek || null},
          ${entity ? articleMarkdown(entity) : article.bodySections.map((section) => `## ${section.title}\n\n${section.body.join("\n\n")}`).join("\n\n")},
          ${transaction.json(article.bodySections)}, ${article.authorPersona || null},
          ${transaction.json({ data: article })}, ${article.createdAt}, ${article.updatedAt}
        ) on conflict (slug) do update set
          entity_id = excluded.entity_id, title = excluded.title,
          dek = excluded.dek, body_markdown = excluded.body_markdown,
          structured_body = excluded.structured_body, author_name = excluded.author_name,
          compatibility_snapshot = excluded.compatibility_snapshot,
          updated_at = excluded.updated_at
      `;
      await persistPublication(
        transaction,
        "article",
        articleId,
        article.publishedStatus === "published" ? "published" : "draft",
        article.publishedAt || article.updatedAt
      );
    }

    for (const dossier of data.dossiers) {
      const entityId = entityIds.get(dossier.entityId) ?? entityIds.get(dossier.slug);
      if (!entityId) throw new Error(`Dossier ${dossier.id} has no matching entity`);
      const entity = data.entities.find((candidate) => entityIds.get(candidate.slug) === entityId);
      const existingDossiers = await transaction<{ id: string }[]>`
        select id from deeptechly.dossiers where slug = ${dossier.slug} limit 1
      `;
      const dossierId = existingDossiers[0]?.id || dossier.id;
      await transaction`
        insert into deeptechly.dossiers (
          id, entity_id, slug, public_markdown, public_content,
          institutional_markdown, institutional_content, compatibility_snapshot,
          created_at, updated_at
        ) values (
          ${dossierId}, ${entityId}, ${dossier.slug},
          ${entity ? dossierMarkdown(entity) : ""}, ${transaction.json(dossier.dossier)},
          ${null}, ${transaction.json(dossier.dossier)},
          ${transaction.json({ data: dossier })}, ${dossier.createdAt}, ${dossier.updatedAt}
        ) on conflict (slug) do update set
          entity_id = excluded.entity_id,
          public_markdown = excluded.public_markdown,
          public_content = excluded.public_content,
          institutional_content = excluded.institutional_content,
          compatibility_snapshot = excluded.compatibility_snapshot,
          updated_at = excluded.updated_at
      `;
      await persistPublication(
        transaction,
        "dossier",
        dossierId,
        dossier.publishedStatus === "published" ? "published" : "draft",
        dossier.updatedAt
      );
    }

    for (const job of data.jobs) {
      const entityId = job.entityId
        ? entityIds.get(job.entityId) ?? job.entityId
        : job.feed?.slug
          ? entityIds.get(job.feed.slug) ?? null
          : null;
      await transaction`
        insert into deeptechly.research_jobs (
          id, account_id, requested_entity, research_mode, status, current_stage,
          progress, idempotency_key, workflow_provider, workflow_run_id,
          attempt_count, max_attempts, next_retry_at, heartbeat_at, entity_id,
          public_error, internal_error, compatibility_snapshot,
          created_at, started_at, completed_at, updated_at
        ) values (
          ${job.id}, ${job.userId || null}, ${job.query}, ${job.mode}, ${job.statusLabel},
          ${job.stage}, ${job.progress}, ${`runtime:${job.id}`},
          ${job.orchestration?.provider || "local"}, ${job.orchestration?.runId || null},
          ${job.orchestration?.attemptCount || job.retry_count || 0},
          ${job.orchestration?.maxAttempts || 3}, ${job.orchestration?.nextRetryAt || null},
          ${job.last_heartbeat_at || null}, ${entityId}, ${job.error || null},
          ${transaction.json(buildInternalError(job))}, ${transaction.json({ data: job })},
          ${job.createdAt}, ${job.active_started_at || null}, ${job.completedAt}, ${job.updatedAt}
        ) on conflict (id) do update set
          account_id = excluded.account_id, requested_entity = excluded.requested_entity,
          research_mode = excluded.research_mode, status = excluded.status,
          current_stage = excluded.current_stage, progress = excluded.progress,
          workflow_provider = excluded.workflow_provider,
          workflow_run_id = excluded.workflow_run_id,
          attempt_count = excluded.attempt_count, max_attempts = excluded.max_attempts,
          next_retry_at = excluded.next_retry_at, heartbeat_at = excluded.heartbeat_at,
          entity_id = excluded.entity_id, public_error = excluded.public_error,
          internal_error = excluded.internal_error,
          compatibility_snapshot = excluded.compatibility_snapshot,
          started_at = excluded.started_at, completed_at = excluded.completed_at,
          updated_at = excluded.updated_at
      `;
      await transaction`
        insert into deeptechly.research_runs (
          id, research_job_id, run_number, status, methodology_version,
          trace_provider, trace_id, started_at, completed_at
        ) values (
          ${`run:runtime:${job.id}`}, ${job.id}, 1, ${job.statusLabel}, 'v2-runtime',
          ${job.orchestration?.provider || "local"}, ${job.orchestration?.runId || null},
          ${job.active_started_at || job.createdAt}, ${job.completedAt}
        ) on conflict (research_job_id, run_number) do update set
          status = excluded.status, trace_provider = excluded.trace_provider,
          trace_id = excluded.trace_id, completed_at = excluded.completed_at
      `;
    }

    for (const event of data.searchEvents) {
      await transaction`
        insert into deeptechly.search_events (
          id, research_run_id, legacy_job_id, query, provider, result_count, created_at
        ) values (
          ${event.id}, ${`run:runtime:${event.jobId}`}, ${event.jobId}, ${event.query},
          ${event.provider}, ${event.resultCount}, ${event.createdAt}
        ) on conflict (id) do update set
          query = excluded.query, provider = excluded.provider,
          result_count = excluded.result_count
      `;
    }

    const snapshotHash = hashValue(JSON.stringify({
      jobs: data.jobs.map((item) => [item.id, item.updatedAt]),
      entities: data.entities.map((item) => [item.slug, item.updatedAt]),
      articles: data.articles.map((item) => [item.id, item.updatedAt]),
      dossiers: data.dossiers.map((item) => [item.id, item.updatedAt])
    }));
    await transaction`
      insert into deeptechly.outbox_events (
        id, topic, aggregate_type, aggregate_id, payload, idempotency_key, created_at
      ) values (
        ${`outbox:${snapshotHash}`}, 'research.store.persisted', 'research_store', 'primary',
        ${transaction.json({
          jobCount: data.jobs.length,
          entityCount: data.entities.length,
          articleCount: data.articles.length,
          dossierCount: data.dossiers.length
        })}, ${`research-store:${snapshotHash}`}, now()
      ) on conflict (idempotency_key) do nothing
    `;
  });
}

async function persistEntityKnowledge(
  sql: TransactionSql,
  entityId: string,
  entity: ResearchEntity
) {
  for (const source of entity.sources) {
    const normalizedUrl = canonicalUrl(source.url);
    const existingSources = await sql<{ id: string }[]>`
      select id from deeptechly.sources
      where canonical_url = ${normalizedUrl} and coalesce(content_hash, '') = ''
      limit 1
    `;
    const sourceId = existingSources[0]?.id || `source:${hashValue(normalizedUrl).slice(0, 32)}`;
    await sql`
      insert into deeptechly.sources (
        id, canonical_url, original_url, title, publisher, source_type,
        authority_tier, published_at, retrieved_at, acquisition_provider,
        acquisition_metadata, created_at
      ) values (
        ${sourceId}, ${normalizedUrl}, ${source.url}, ${source.title || null},
        ${source.publisher || null}, ${source.type || null}, ${authorityTier(source)},
        ${source.date || null}, ${source.retrievedAt || entity.lastResearchedAt},
        'deeptechly-runtime', ${sql.json({ supportsClaims: source.supportsClaims || [] })}, now()
      ) on conflict (id) do update set
        title = excluded.title, publisher = excluded.publisher,
        source_type = excluded.source_type, authority_tier = excluded.authority_tier,
        retrieved_at = excluded.retrieved_at,
        acquisition_metadata = excluded.acquisition_metadata
    `;
    await sql`
      insert into deeptechly.entity_sources (entity_id, source_id, relationship)
      values (${entityId}, ${sourceId}, 'evidence')
      on conflict (entity_id, source_id) do update set relationship = excluded.relationship
    `;
    await sql`
      insert into deeptechly.evidence (
        id, source_id, excerpt, locator, extraction_method, extraction_version,
        content_hash, created_at
      ) values (
        ${`evidence:${sourceId}`}, ${sourceId}, ${null}, ${source.url},
        'source_record', 'v2-runtime', ${hashValue(source.url)}, now()
      ) on conflict (id) do update set locator = excluded.locator
    `;
  }

  const claims = [
    ...entity.dossier.accuracyAndConfidence.confirmed.map((text) => ({ text, state: "CONFIRMED" })),
    ...entity.dossier.accuracyAndConfidence.inferred.map((text) => ({ text, state: "INFERRED" })),
    ...entity.dossier.accuracyAndConfidence.unverified.map((text) => ({ text, state: "UNVERIFIED" }))
  ];
  for (const claim of claims) {
    const claimId = `claim:${hashValue(`${entityId}:${claim.state}:${claim.text}`).slice(0, 32)}`;
    await sql`
      insert into deeptechly.claims (
        id, entity_id, claim_type, claim_text, state, confidence,
        methodology_version, created_at, updated_at
      ) values (
        ${claimId}, ${entityId}, 'research_fact', ${claim.text}, ${claim.state},
        ${normalizeConfidence(entity.confidenceScore)}, 'v2-runtime', now(), now()
      ) on conflict (id) do update set
        claim_text = excluded.claim_text, state = excluded.state,
        confidence = excluded.confidence, updated_at = now()
    `;
    for (const source of entity.sources.filter((item) => item.supportsClaims?.includes(claim.text))) {
      const normalizedUrl = canonicalUrl(source.url);
      const existingSources = await sql<{ id: string }[]>`
        select id from deeptechly.sources
        where canonical_url = ${normalizedUrl} and coalesce(content_hash, '') = ''
        limit 1
      `;
      const sourceId = existingSources[0]?.id || `source:${hashValue(normalizedUrl).slice(0, 32)}`;
      await sql`
        insert into deeptechly.claim_evidence (claim_id, evidence_id, support_type, weight)
        values (${claimId}, ${`evidence:${sourceId}`}, 'supports', ${normalizeConfidence(entity.confidenceScore)})
        on conflict (claim_id, evidence_id) do update set support_type = excluded.support_type
      `;
    }
  }
}

async function persistPublication(
  sql: TransactionSql,
  artifactType: "article" | "profile" | "dossier",
  artifactId: string,
  state: "draft" | "published",
  timestamp: string
) {
  await sql`
    insert into deeptechly.publications (
      id, artifact_type, artifact_id, state, eligibility, published_at, updated_at
    ) values (
      ${`publication:${artifactType}:${artifactId}`}, ${artifactType}, ${artifactId},
      ${state}, '{}'::jsonb, ${state === "published" ? timestamp : null}, ${timestamp}
    ) on conflict (artifact_type, artifact_id) do update set
      state = excluded.state, published_at = excluded.published_at,
      updated_at = excluded.updated_at
  `;
}

function parseRows<T>(rows: Array<{ data: string }>, table: string) {
  return rows.map((row, index) => {
    if (!row.data) throw new Error(`${table} row ${index + 1} has no compatibility data`);
    try {
      return JSON.parse(row.data) as T;
    } catch (error) {
      throw new Error(`${table} row ${index + 1} contains malformed compatibility JSON`, { cause: error });
    }
  });
}

function databaseConfidenceLabel(label: string) {
  return label.replaceAll(" ", "_");
}

function normalizeConfidence(score: number) {
  return Math.max(0, Math.min(1, score > 1 ? score / 100 : score));
}

function canonicalUrl(value: string) {
  try {
    const url = new URL(value);
    url.hash = "";
    return url.toString().replace(/\/$/, "");
  } catch {
    return value.trim();
  }
}

function authorityTier(source: Source) {
  if (["company_site", "government", "patent", "academic"].includes(source.type)) return "primary";
  if (["press_release", "news", "investor"].includes(source.type)) return "secondary";
  return "discovery";
}

function buildInternalError(job: ResearchJob) {
  return job.failure_message_internal
    ? {
        code: job.failure_code,
        stage: job.failure_stage,
        message: job.failure_message_internal
      }
    : {};
}

function hashValue(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function createOneOffConnection(connectionUrl: string) {
  const existing = getPostgres();
  if (existing) return existing;
  // Only the isolated migration validator passes an explicit URL without runtime env.
  return postgres(connectionUrl, {
    max: 1,
    prepare: false,
    connect_timeout: 5,
    idle_timeout: 2,
    onnotice: () => undefined
  });
}
