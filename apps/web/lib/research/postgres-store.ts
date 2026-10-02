import postgres from "postgres";
import type { ResearchEntity } from "@/lib/types";
import type {
  ResearchJob,
  ResearchStoreData,
  StoredDossier,
  StoredResearchArticle
} from "./types";

const provider = process.env.DEEPTECHLY_RESEARCH_STORE_PROVIDER?.trim();
const databaseUrl = process.env.DEEPTECHLY_V2_DATABASE_URL?.trim();
const databaseHost = process.env.DEEPTECHLY_V2_DATABASE_HOST?.trim();
const databasePort = Number(process.env.DEEPTECHLY_V2_DATABASE_PORT ?? 5432);
const databaseName = process.env.DEEPTECHLY_V2_DATABASE_NAME?.trim();
const databaseUser = process.env.DEEPTECHLY_V2_DATABASE_USER?.trim();
const databasePassword = process.env.DEEPTECHLY_V2_DATABASE_PASSWORD;

export function isV2PostgresStoreSelected() {
  return provider === "v2-postgres";
}

export async function readV2PostgresStore(
  connectionUrl = databaseUrl
): Promise<ResearchStoreData> {
  if (!connectionUrl && !(databaseHost && databaseName)) {
    throw new Error(
      "The v2-postgres provider requires a V2 database URL or host and database name"
    );
  }

  const connectionOptions = {
    max: 1,
    prepare: false,
    connect_timeout: 5,
    idle_timeout: 2,
    onnotice: () => undefined
  } as const;
  const sql = connectionUrl
    ? postgres(connectionUrl, connectionOptions)
    : postgres({
        ...connectionOptions,
        host: databaseHost!,
        port: databasePort,
        database: databaseName!,
        ...(databaseUser ? { username: databaseUser } : {}),
        ...(databasePassword ? { password: databasePassword } : {})
      });

  try {
    const [jobs, entities, articles, dossiers] = await Promise.all([
      sql<{ data: string }[]>`
        select compatibility_snapshot ->> 'data' as data
        from deeptechly.research_jobs
        order by updated_at desc
      `,
      sql<{ data: string }[]>`
        select compatibility_snapshot ->> 'data' as data
        from deeptechly.entities
        order by updated_at desc
      `,
      sql<{ data: string }[]>`
        select compatibility_snapshot ->> 'data' as data
        from deeptechly.articles
        order by updated_at desc
      `,
      sql<{ data: string }[]>`
        select compatibility_snapshot ->> 'data' as data
        from deeptechly.dossiers
        order by updated_at desc
      `
    ]);

    return {
      jobs: parseRows<ResearchJob>(jobs, "research_jobs"),
      entities: parseRows<ResearchEntity>(entities, "entities"),
      articles: parseRows<StoredResearchArticle>(articles, "articles"),
      dossiers: parseRows<StoredDossier>(dossiers, "dossiers"),
      searchEvents: []
    };
  } finally {
    await sql.end({ timeout: 2 });
  }
}

function parseRows<T>(rows: Array<{ data: string }>, table: string) {
  return rows.map((row, index) => {
    if (!row.data) throw new Error(`${table} row ${index + 1} has no compatibility data`);
    try {
      return JSON.parse(row.data) as T;
    } catch (error) {
      throw new Error(`${table} row ${index + 1} contains malformed compatibility JSON`, {
        cause: error
      });
    }
  });
}
